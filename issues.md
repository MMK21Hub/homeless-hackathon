# Fold Rescue: GitHub issues

---

## Issue 0: Agree the shared interface (everyone, 0:00 to 0:10)

**Labels:** `blocker`, `core`  
**Assignee:** whole team

Before anyone codes, agree these function shapes so every role can build and test against fake data. Positions are 1-indexed.

```python
fold(sequence: str) -> {"pdb": str, "plddt": list[float], "mean": float}

find_weak_regions(plddt: list[float], threshold: float = 70) -> list[{"start": int, "end": int, "mean": float}]

apply_mutation(sequence: str, position: int, new_letter: str) -> {"ok": bool, "sequence": str, "error": str | None}

commit_or_revert(state: dict, candidate: dict) -> dict
# state = {"best_sequence": str, "best_mean": float, "history": list[round_entry]}
# round_entry = {"round": int, "mutation": "L45D", "reason": str,
#                "mean_before": float, "mean_after": float, "kept": bool}
```

The agent emits one `round_entry` per round; the UI renders from that list.

**Done when**
- [ ] Shapes pasted into `INTERFACE.md` in the repo
- [ ] Everyone has read it and agrees
- [ ] A fake-data example of one `fold()` result and one `round_entry` is committed in `data/`

---

## Issue 1: Agent loop with Gemma 4 function calling (Joshua)

**Labels:** `core`  
**Owner:** Agent lead  
**Depends on:** Issue 0

Run Gemma 4 locally with Ollama and build the loop that lets it choose tools, read results and repeat.

**Tasks**
- [ ] `ollama run gemma4` working on the demo laptop (use the largest size it can run)
- [ ] One dummy tool call end to end by 0:20: model requests a tool, our code runs it, model reads the answer
- [x] System prompt: investigate before proposing, one mutation per round, always explain why in 1 to 2 sentences, never invent scores
- [x] Loop with a hard cap of 10 rounds; our code holds state, not the model
- [x] Validate every tool call; retry once on a malformed call, then skip the round
- [x] Emit one `round_entry` per round for the UI

**Done when:** a full run completes with the real tools and every round produces a valid `round_entry`.

---

## Issue 2: `fold()` tool and result caching

**Labels:** `core`, `blocker`  
**Owner:** Fold tool  
**Depends on:** Issue 0

**Tasks**
- [ ] First 10 minutes: check the ESMFold API address, sequence length limit and response format against its documentation (not yet verified)
- [ ] Implement `fold(sequence)` returning the PDB text, per-bead pLDDT and the mean
- [ ] Confirm the scale of the pLDDT values (0 to 1 or 0 to 100) and normalise to 0 to 100
- [ ] Cache every result on disk, keyed by sequence, so repeated folds are instant and a backup run works offline
- [ ] Handle timeouts and rate limits with one retry and a clear error

**Done when:** `fold()` returns a valid score for the healthy and damaged sequences, and a second call for the same sequence returns from cache.

---

## Issue 3: Logic tools (`find_weak_regions`, `apply_mutation`, `commit_or_revert`)

**Labels:** `core`  
**Owner:** Logic tools  
**Depends on:** Issue 0

Plain Python, no AI needed. Test each one from a script.

**Tasks**
- [ ] `find_weak_regions()` groups consecutive beads below the threshold into stretches
- [ ] `apply_mutation()` rejects invalid positions and letters outside the 20 amino acids, and refuses no-op mutations
- [ ] `commit_or_revert()` keeps a change only if the mean score rose, and appends a `round_entry`
- [ ] Unit tests with fake `fold()` results
- [ ] Do not allow the same failed mutation to be retried (track it in history)

**Done when:** all three pass their tests and can be imported by the agent loop.

---

## Issue 4: Streamlit screen

**Labels:** `ui`  
**Owner:** Screen  
**Depends on:** Issue 0

**Tasks**
- [ ] Layout: 3D view on the left, score chart and commentary feed on the right
- [ ] Run button that starts the agent loop and streams rounds as they finish
- [ ] Commentary feed shows each round: mutation, the agent's reason, score before and after, kept or reverted
- [ ] Line chart of mean score by round
- [ ] Build against the fake data from Issue 0 until the real loop is ready
- [ ] "Replay backup run" button that plays a cached run with no network

**Done when:** one click runs the whole thing on screen, and the replay button works with wifi off.

---

## Issue 5: 3D protein view

**Labels:** `ui`  
**Owner:** 3D view  
**Depends on:** Issue 0

**Tasks**
- [ ] Render a PDB string with py3Dmol (or stmol) inside Streamlit
- [ ] Colour each bead by pLDDT (for example blue = confident, orange = floppy) with a small legend
- [ ] Highlight the mutated position each round
- [ ] Side-by-side or toggle view of the damaged start and the current best
- [ ] Works from a cached structure with no network

**Done when:** the view updates after each round and the colours visibly shift from floppy to confident when the score rises.

---

## Issue 6: Target protein, baseline check and demo story

**Labels:** `science`, `blocker`  
**Owner:** Science and story  
**Depends on:** Issue 2 (needs a working `fold()`)

**Tasks**
- [x] Confirm the target sequence (first choice: ubiquitin, 76 beads) against UniProt
- [x] Find 4 to 6 buried oily positions in the core and swap them for charged or polar letters to create the damaged sequence
- [ ] **By 0:15:** fold healthy and damaged, report the score gap. Aim for 15+ points. If smaller, damage more or scramble a whole stretch
- [x] Commit both sequences to `data/target.fasta`
- [ ] After the first good run, save it as the backup replay
- [x] Write the 3-minute demo script (rehearsal still to do)
- [x] Finish the README: team names, license, accurate setup commands
- [x] Prepare plain answers to: what is a protein, what does pLDDT mean, why does the agent revert changes, what is not claimed (a lab test would be next)

**Done when:** the baseline gap is confirmed, a backup run exists, and everyone can give the demo.

---

## Issue 7: Integration (1:00)

**Labels:** `core`  
**Owners:** Agent lead and Logic tools, with help from Fold tool  
**Depends on:** Issues 1, 2, 3

**Tasks**
- [ ] Connect the agent loop to the real `fold()` and logic tools
- [ ] Run a full 10-round run and check the score trends up
- [ ] Fix prompt or tool-call problems found (invalid mutations, repeated guesses)
- [ ] Hand the working loop to the Screen and 3D view owners

**Done when:** a complete run works from a script with real tools.

---

## Issue 8: Merge the screen and run end to end (1:30 to 1:50)

**Labels:** `core`, `ui`  
**Owners:** Screen and 3D view  
**Depends on:** Issues 4, 5, 7

**Tasks**
- [ ] Merge the 3D view into the Streamlit page
- [ ] Connect the page to the real agent loop
- [ ] Test the full run three times; save the best as the backup
- [ ] Check the page on the demo laptop at presentation resolution

**Done when:** one click runs the full demo and the replay works offline.

---

## Issue 9 (stretch): Compare to the AlphaFold reference

**Labels:** `stretch`  
**Owner:** whoever is free after 1:30  
**Depends on:** Issue 8 done

Only start once the core demo works end to end.

**Tasks**
- [ ] Download the healthy protein's structure from the AlphaFold DB and cache it (URL and format not yet verified)
- [ ] Add `compare_to_reference(candidate_pdb)` returning RMSD (lower = closer), using Biopython
- [ ] Show RMSD as a second line on the chart and give it to the agent each round
- [ ] If it does not land, drop it and do not mention AlphaFold as part of the pipeline in the demo

**Done when:** the agent sees RMSD each round and the chart shows it falling as the score rises.
