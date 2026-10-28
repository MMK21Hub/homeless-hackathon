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
            if response.status_code == 429:
                time.sleep(2 ** attempt * 2)
                last_error = RuntimeError("Rate limited by fold API")
                continue
            response.raise_for_status()
        except requests.RequestException as exc:
            last_error = exc
            if attempt == retries - 1:
                raise
            time.sleep(2 ** attempt)
    else:
        if last_error is not None:
            raise RuntimeError(f"Fold API failed after retries: {last_error}")
        raise RuntimeError("Fold API failed after retries")

    pdb = response.text
    plddt = _parse_plddt(pdb)
    if len(plddt) != len(seq):
        raise RuntimeError(f"Got {len(plddt)} scores for {len(seq)} residues")

    result = {"pdb": pdb, "plddt": plddt, "mean": sum(plddt) / len(plddt)}
    cache_file.write_text(json.dumps(result))
    return result


if __name__ == "__main__":
    UBIQUITIN_BAD = "MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDHWQQLSERLLLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG"
    print(fold(UBIQUITIN_BAD))