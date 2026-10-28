AMINO_ACIDS = set("ACDEFGHIKLMNPQRSTVWY")


def apply_mutation(sequence, position, new_letter):
    """Swap one letter in the sequence. Position is 1-indexed.

    Returns {"ok": bool, "sequence": str, "error": str | None}. On failure the
    original sequence comes back unchanged, so the caller can keep going.
    """
    def fail(error):
        return {"ok": False, "sequence": sequence, "error": error}

    if isinstance(position, bool) or not isinstance(position, int):
        return fail(f"Position must be a whole number, got {position!r}")
    if not 1 <= position <= len(sequence):
        return fail(f"Position {position} is outside 1 to {len(sequence)}")

    letter = str(new_letter).strip().upper()
    if letter not in AMINO_ACIDS:
        return fail(f"{new_letter!r} is not one of the 20 amino acids")

    old_letter = sequence[position - 1]
    if old_letter == letter:
        return fail(f"Position {position} is already {letter}, that is a no-op")

    mutated = sequence[:position - 1] + letter + sequence[position:]
    return {"ok": True, "sequence": mutated, "error": None}
