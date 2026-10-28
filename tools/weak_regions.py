def find_weak_regions(plddt, threshold: float = 70):
    """Group consecutive low-confidence residues into contiguous stretches."""
    if not isinstance(plddt, (list, tuple)):
        raise TypeError("plddt must be a list or tuple of numbers")

    regions = []
    start = None
    total = 0.0
    count = 0

    for index, score in enumerate(plddt):
        if score < threshold:
            if start is None:
                start = index
                total = float(score)
                count = 1
            else:
                total += float(score)
                count += 1
        elif start is not None:
            regions.append({
                "start": start + 1,
                "end": index,
                "mean": total / count,
            })
            start = None
            total = 0.0
            count = 0

    if start is not None:
        regions.append({
            "start": start + 1,
            "end": len(plddt),
            "mean": total / count,
        })

    return regions
