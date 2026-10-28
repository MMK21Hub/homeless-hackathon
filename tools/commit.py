def commit_or_revert(state, candidate):
    """Keep a mutation only when it improves the best mean pLDDT.

    Appends one round_entry to history either way. A reverted round still
    records the score the attempt actually got, so the commentary feed can
    show how bad it was.
    """
    mean_before = state["best_mean"]
    mean_after = candidate.get("mean", mean_before)
    kept = mean_after > mean_before

    entry = {
        "round": candidate.get("round"),
        "mutation": candidate.get("mutation"),
        "reason": candidate.get("reason", ""),
        "mean_before": mean_before,
        "mean_after": mean_after,
        "kept": kept,
    }

    if kept:
        state["best_sequence"] = candidate["sequence"]
        state["best_mean"] = mean_after
        state["best_plddt"] = candidate.get("plddt", state.get("best_plddt"))

    state["history"].append(entry)
    return state
