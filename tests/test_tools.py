"""Tests for the logic tools, using fake fold() results. Run: python3 tests/test_tools.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "tools"))

from commit import commit_or_revert
from mutate import apply_mutation
from weak_regions import find_weak_regions

SEQ = "MQIFVKTLTG"


def test_finds_one_stretch():
    plddt = [95, 95, 40, 50, 60, 95, 95]
    assert find_weak_regions(plddt) == [{"start": 3, "end": 5, "mean": 50.0}]


def test_finds_several_stretches_and_handles_the_ends():
    plddt = [20, 30, 95, 95, 10]
    assert find_weak_regions(plddt) == [
        {"start": 1, "end": 2, "mean": 25.0},
        {"start": 5, "end": 5, "mean": 10.0},
    ]


def test_nothing_weak_and_custom_threshold():
    assert find_weak_regions([95, 90, 99]) == []
    assert find_weak_regions([80, 95], threshold=90) == [{"start": 1, "end": 1, "mean": 80.0}]


def test_mutation_applies_at_the_right_1_indexed_spot():
    result = apply_mutation(SEQ, 1, "A")
    assert result == {"ok": True, "sequence": "AQIFVKTLTG", "error": None}
    assert apply_mutation(SEQ, 10, "A")["sequence"] == "MQIFVKTLTA"
    assert apply_mutation(SEQ, 4, "d")["sequence"] == "MQIDVKTLTG"  # lowercase accepted


def test_mutation_leaves_the_original_sequence_alone():
    apply_mutation(SEQ, 1, "A")
    assert SEQ == "MQIFVKTLTG"


def test_mutation_rejects_bad_input():
    for position in (0, 11, -1, 1.5, "3", None):
        assert apply_mutation(SEQ, position, "A")["ok"] is False
    for letter in ("B", "X", "", "AA", "1"):
        assert apply_mutation(SEQ, 2, letter)["ok"] is False
    no_op = apply_mutation(SEQ, 1, "M")
    assert no_op["ok"] is False and "no-op" in no_op["error"]
    assert apply_mutation(SEQ, 0, "A")["sequence"] == SEQ


def _state():
    return {"best_sequence": SEQ, "best_mean": 70.0, "history": []}


def _candidate(mean, mutation="M1A"):
    return {"round": 1, "mutation": mutation, "reason": "because",
            "sequence": "AQIFVKTLTG", "mean": mean}


def test_commit_keeps_an_improvement():
    state = commit_or_revert(_state(), _candidate(75.0))
    assert state["best_sequence"] == "AQIFVKTLTG"
    assert state["best_mean"] == 75.0
    assert state["history"][-1] == {"round": 1, "mutation": "M1A", "reason": "because",
                                    "mean_before": 70.0, "mean_after": 75.0, "kept": True}


def test_commit_reverts_a_drop_and_a_tie():
    for mean in (65.0, 70.0):
        state = commit_or_revert(_state(), _candidate(mean))
        assert state["best_sequence"] == SEQ
        assert state["best_mean"] == 70.0
        entry = state["history"][-1]
        assert entry["kept"] is False
        # The feed needs the score the attempt really got, not the old one.
        assert entry["mean_before"] == 70.0 and entry["mean_after"] == mean


def test_history_records_every_round_so_retries_can_be_blocked():
    state = _state()
    commit_or_revert(state, _candidate(65.0, "M1A"))
    commit_or_revert(state, _candidate(75.0, "Q2D"))
    assert [h["mutation"] for h in state["history"]] == ["M1A", "Q2D"]
    assert [h["kept"] for h in state["history"]] == [False, True]


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for test in tests:
        test()
        print(f"ok  {test.__name__}")
    print(f"\n{len(tests)} tests passed")
