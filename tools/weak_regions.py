def _region(plddt, start, end):
    scores = plddt[start - 1:end]
    return {"start": start, "end": end, "mean": sum(scores) / len(scores)}


def find_weak_regions(plddt, threshold=70):
    """Group consecutive beads scoring below the threshold into stretches.

    Takes the per-bead pLDDT list from fold(). Positions are 1-indexed and
    inclusive, so {"start": 3, "end": 5} means beads 3, 4 and 5.
    """
    regions = []
    start = None
    for position, score in enumerate(plddt, start=1):
        if score < threshold:
            if start is None:
                start = position
        elif start is not None:
            regions.append(_region(plddt, start, position - 1))
            start = None
    if start is not None:
        regions.append(_region(plddt, start, len(plddt)))
    return regions
