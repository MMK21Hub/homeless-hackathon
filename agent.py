"""Gemma 4 agent loop: picks one mutation per round, our code keeps the state."""
import json

import ollama

MODEL = "gemma4"
MAX_ROUNDS = 10
MAX_STEPS = 6  # tool calls allowed per round before we give up on it

SYSTEM_PROMPT = """You repair a damaged protein one mutation at a time.
Rules:
- Investigate before proposing: call find_weak_regions first.
- Propose exactly one mutation per round with propose_mutation.
- Always explain why in 1 to 2 sentences in the reason field.
- Never invent scores. Only use numbers our tools return.
- Do not repeat a mutation listed in the history."""

TOOLS = [
    {"type": "function", "function": {
        "name": "find_weak_regions",
        "description": "Stretches of the current best protein with low pLDDT (1-indexed).",
        "parameters": {"type": "object", "properties": {
            "threshold": {"type": "number", "description": "pLDDT cutoff, default 70"}},
            "required": []}}},
    {"type": "function", "function": {
        "name": "propose_mutation",
        "description": "Propose one mutation. Ends the round; our code folds it and keeps or reverts it.",
        "parameters": {"type": "object", "properties": {
            "position": {"type": "integer", "description": "1-indexed position"},
            "new_letter": {"type": "string", "description": "One of the 20 amino acid letters"},
            "reason": {"type": "string", "description": "Why, in 1 to 2 sentences"}},
            "required": ["position", "new_letter", "reason"]}}},
]


def _status(state, rnd):
    tried = [h["mutation"] for h in state["history"] if h["mutation"]]
    return (f"Round {rnd}. Current best sequence ({len(state['best_sequence'])} beads):\n"
            f"{state['best_sequence']}\nMean pLDDT: {state['best_mean']:.1f}\n"
            f"Already tried: {', '.join(tried) or 'none'}")


def _propose(state, rnd, tools, chat):
    """Run tool calls until the model proposes a valid mutation. Returns (mutation, reason, candidate) or an error string."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _status(state, rnd)}]
    retried = False
    for _ in range(MAX_STEPS):
        msg = chat(model=MODEL, messages=messages, tools=TOOLS).message
        messages.append(msg)
        if not msg.tool_calls:
            error = "No tool call. Call find_weak_regions or propose_mutation."
        for call in msg.tool_calls or []:
            name, args = call.function.name, call.function.arguments or {}
            error = None
            try:
                if name == "find_weak_regions":
                    result = tools["find_weak_regions"](state["best_plddt"], float(args.get("threshold", 70)))
                elif name == "propose_mutation":
                    pos, letter = int(args["position"]), str(args["new_letter"]).upper()
                    reason = str(args["reason"]).strip()
                    old = state["best_sequence"][pos - 1] if 1 <= pos <= len(state["best_sequence"]) else "?"
                    mutation = f"{old}{pos}{letter}"
                    if any(h["mutation"] == mutation for h in state["history"]):
                        raise ValueError(f"{mutation} was already tried")
                    edit = tools["apply_mutation"](state["best_sequence"], pos, letter)
                    if not edit["ok"]:
                        raise ValueError(edit["error"])
                    return mutation, reason, edit["sequence"]
                else:
                    raise ValueError(f"Unknown tool {name}")
            except (KeyError, TypeError, ValueError) as e:
                error = f"Invalid call to {name}: {e}"
                result = {"error": error}
            messages.append({"role": "tool", "tool_name": name, "content": json.dumps(result)})
        if error:
            if retried:
                return error
            retried = True
    return "Too many steps without a valid mutation"


def run(sequence, tools, rounds=MAX_ROUNDS, chat=ollama.chat):
    """Yield one round_entry per round. `tools` maps names to the Issue 0 functions."""
    start = tools["fold"](sequence)
    state = {"best_sequence": sequence, "best_mean": start["mean"],
             "best_plddt": start["plddt"], "history": []}
    for rnd in range(1, rounds + 1):
        proposal = _propose(state, rnd, tools, chat)
        if isinstance(proposal, str):  # malformed twice: skip the round
            entry = {"round": rnd, "mutation": "", "reason": f"Skipped: {proposal}",
                     "mean_before": state["best_mean"], "mean_after": state["best_mean"], "kept": False}
            state["history"].append(entry)
            yield entry
            continue
        mutation, reason, new_seq = proposal
        folded = tools["fold"](new_seq)
        candidate = {"round": rnd, "mutation": mutation, "reason": reason,
                     "sequence": new_seq, "mean": folded["mean"], "plddt": folded["plddt"]}
        state = tools["commit_or_revert"](state, candidate)
        if state["best_sequence"] == new_seq:
            state["best_plddt"] = folded["plddt"]
        yield state["history"][-1]
