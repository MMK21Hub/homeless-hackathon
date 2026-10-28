def commit_or_revert(state, candidate):
    """Keep the candidate only if the mean pLDDT rose, otherwise throw it away.

    state     = {"best_sequence": str, "best_mean": float, "history": list}
    candidate = {"round": int, "mutation": str, "reason": str,
                 "sequence": str, "mean": float}

    Always appends one round_entry to history, kept or not, so the UI can show
    the reverts and the agent can see what it has already tried.
    """
    mean_before = state["best_mean"]
    mean_after = candidate["mean"]
    kept = mean_after > mean_before

    state["history"].append({
        "round": candidate["round"],
        "mutation": candidate["mutation"],
        "reason": candidate["reason"],
        "mean_before": mean_before,
        "mean_after": mean_after,
        "kept": kept,
    })

    if kept:
        state["best_sequence"] = candidate["sequence"]
        state["best_mean"] = mean_after

    return state
