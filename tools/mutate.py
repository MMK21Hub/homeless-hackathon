VALID = set("ACDEFGHIKLMNPQRSTVWY")


def apply_mutation(sequence: str, position: int, new_letter: str):
    """Apply a single amino-acid substitution to a sequence."""
    if not isinstance(sequence, str) or not sequence:
        return {"ok": False, "sequence": sequence, "error": "Sequence must be a non-empty string"}

    if not isinstance(position, int):
        return {"ok": False, "sequence": sequence, "error": "Position must be an integer"}

    if not 1 <= position <= len(sequence):
        return {"ok": False, "sequence": sequence, "error": f"Position out of range: {position}"}

    letter = str(new_letter or "").strip().upper()
    if len(letter) != 1 or letter not in VALID:
        return {"ok": False, "sequence": sequence, "error": f"Invalid amino acid: {new_letter!r}"}

    if sequence[position - 1] == letter:
        return {"ok": False, "sequence": sequence, "error": "Mutation is a no-op"}

    mutated = sequence[: position - 1] + letter + sequence[position:]
    return {"ok": True, "sequence": mutated, "error": None}
