# tools/fold.py
import hashlib, json, time
from pathlib import Path
import requests

#TOKEN = "2wGSuBBXuyvBVXaZGjv3MO"
# VERIFY against current ESM Atlas docs: URL, length limit, response format.
FOLD_URL = "https://api.esmatlas.com/foldSequence/v1/pdb/"
CACHE_DIR = Path("data/cache")
VALID = set("ACDEFGHIKLMNPQRSTVWY")
MAX_LEN = 400  # check the docs for the real limit

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
    """One pLDDT per residue, read from the B-factor of each CA atom."""
    scores = []
    for line in pdb_text.splitlines():
        if line.startswith("ATOM") and line[12:16].strip() == "CA":
            scores.append(float(line[60:66]))
    # Some predictors write 0-1, others 0-100. Normalise to 0-100.
    if scores and max(scores) <= 1.0:
        scores = [s * 100 for s in scores]
    return scores

def fold(sequence: str, retries: int = 3) -> dict:
    """
    Checks stuff and cache's output with json
    """
    seq = _validate(sequence)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    key = hashlib.sha256(seq.encode()).hexdigest()[:16]
    cache_file = CACHE_DIR / f"{key}.json"

    if cache_file.exists():
        return json.loads(cache_file.read_text())

    for attempt in range(retries):
        try:
            r = requests.post(FOLD_URL, data=seq, timeout=60)
            if r.status_code == 200:
                break
            if r.status_code == 429:          # rate limited
                time.sleep(2 ** attempt * 2)
                continue
            r.raise_for_status()
        except requests.RequestException:
            if attempt == retries - 1:
                raise
            time.sleep(2 ** attempt)
    else:
        raise RuntimeError("Fold API failed after retries")

    pdb = r.text
    plddt = _parse_plddt(pdb)
    if len(plddt) != len(seq):
        raise RuntimeError(f"Got {len(plddt)} scores for {len(seq)} residues")

    result = {
        "sequence": seq,
        "pdb": pdb,
        "plddt": plddt,
        "mean_plddt": sum(plddt) / len(plddt),
    }
    cache_file.write_text(json.dumps(result))
    return result


if __name__ == "__main__":
    INSULIN = "MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCN"
    UBIQUITIN_GOOD = "MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG"
    UBIQUITIN_BAD = "MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDHWQQLSERLLLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG"
    print(fold(UBIQUITIN_BAD))