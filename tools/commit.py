def commit_or_revert(state, candidate):
    """Keep a mutation only when it improves the best mean pLDDT."""
    mean_before = state["best_mean"]
    mean_after = candidate.get("mean", mean_before)
    entry = {
        "round": candidate.get("round"),
        "mutation": candidate.get("mutation"),
        "reason": candidate.get("reason", ""),
        "mean_before": mean_before,
        "mean_after": mean_before,
        "kept": False,
    }

    if mean_after > mean_before:
        state["best_sequence"] = candidate["sequence"]
        state["best_mean"] = mean_after
        state["best_plddt"] = candidate.get("plddt", state.get("best_plddt"))
        entry["kept"] = True
        entry["mean_after"] = mean_after

    state["history"].append(entry)
    return state
