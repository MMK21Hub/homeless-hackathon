# tools/fold.py
import hashlib
import json
import time
from pathlib import Path

import requests

FOLD_URL = "https://api.esmatlas.com/foldSequence/v1/pdb/"
CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "cache"
VALID = set("ACDEFGHIKLMNPQRSTVWY")
MAX_LEN = 400


def _validate(seq: str) -> str:
    seq = seq.strip().upper()
    if not seq:
        raise ValueError("Empty sequence")
    bad = set(seq) - VALID
    if bad:
        raise ValueError(f"Invalid letters: {sorted(bad)}")
    if len(seq) > MAX_LEN:
        raise ValueError(f"Sequence too long ({len(seq)} > {MAX_LEN})")
    return seq


def _parse_plddt(pdb_text: str) -> list[float]:
    """Read one pLDDT score per residue from the CA atom B-factor."""
    scores = []
    for line in pdb_text.splitlines():
        if line.startswith("ATOM") and line[12:16].strip() == "CA":
            scores.append(float(line[60:66]))
    if scores and max(scores) <= 1.0:
        scores = [score * 100 for score in scores]
    return scores


def fold(sequence: str, retries: int = 3) -> dict:
    """Fetch a predicted structure for a protein sequence and cache it by sequence."""
    seq = _validate(sequence)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    key = hashlib.sha256(seq.encode()).hexdigest()[:16]
    cache_file = CACHE_DIR / f"{key}.json"

    if cache_file.exists():
        cached = json.loads(cache_file.read_text())
        if "mean" not in cached:  # cache files written before the key was renamed
            cached["mean"] = sum(cached["plddt"]) / len(cached["plddt"])
        return cached

    last_error = None
    for attempt in range(retries):
        try:
            response = requests.post(FOLD_URL, data=seq, timeout=60)
            if response.status_code == 200:
                break
            last_error = f"HTTP {response.status_code}"
            if response.status_code == 429 or response.status_code >= 500:
                time.sleep(2 ** attempt * 2)
                continue
            response.raise_for_status()
        except requests.RequestException as exc:
            last_error = exc
            time.sleep(2 ** attempt)
    else:
        raise RuntimeError(
            f"Fold API failed after {retries} attempts ({last_error}). "
            "A 504 means the ESM Atlas backend is not folding new sequences; "
            "sequences already in data/cache/ still work. "
            "Run `python3 tools/fold.py` to check whether it is back."
        )

    pdb = response.text
    plddt = _parse_plddt(pdb)
    if len(plddt) != len(seq):
        raise RuntimeError(f"Got {len(plddt)} scores for {len(seq)} residues")

    result = {"pdb": pdb, "plddt": plddt, "mean": sum(plddt) / len(plddt)}
    cache_file.write_text(json.dumps(result))
    return result


if __name__ == "__main__":
    # Is the fold API folding new sequences again? Uses a random sequence so it
    # cannot come back from anyone's cache.
    import random

    probe = "".join(random.choice(sorted(VALID)) for _ in range(24))
    print(f"Asking the fold API for a new 24-bead sequence ({probe})...")
    try:
        result = fold(probe, retries=1)
    except Exception as exc:
        print(f"\nDOWN for new sequences: {exc}")
        raise SystemExit(1)
    print(f"\nWORKING: got {len(result['plddt'])} scores, mean {result['mean']:.1f}")