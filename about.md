# Fold Rescue

An AI agent that repairs a broken protein by trial and error, using a structure predictor as its lab bench. Built for the Gemma hackathon with Gemma 4 and native function calling.

We take a small, well-known protein (ubiquitin, 76 beads), deliberately damage its core, then let a Gemma 4 agent repair it one mutation at a time for up to 10 rounds. Each round it folds the sequence, finds the floppiest stretch, proposes one swap and explains why. If the score rose the change is kept, otherwise it is undone and the agent is told.

- **[idea.md](idea.md)** — what a protein is, how the loop works, architecture, limitations
- **[DEMO.md](DEMO.md)** — the 3-minute demo script and plain answers to likely questions
- **[issues.md](issues.md)** — the task breakdown and who owns what

## Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Get Gemma 4 running locally (several GB, start it early)
ollama pull gemma4

# 3. Launch the app
streamlit run app.py
```

The agent talks to Ollama at `localhost:11434`. To use a model on another machine instead, forward that port over SSH and leave the window open:

```bash
ssh -L 11434:localhost:11434 user@their-ip
```

`ollama list` in a second terminal confirms the model is reachable.

## Status

Hackathon project in progress.

| Piece | State |
| --- | --- |
| Agent loop (`agent.py`) | Built. Runs end to end against the real logic tools |
| `fold()` (`tools/fold.py`) | Built, caches to `data/cache/` |
| Logic tools (`tools/`) | Built and tested, 9 tests in `tests/test_tools.py` |
| UI | Next.js app started in `frontend/`. `app.py` is empty, so the Streamlit plan in [idea.md](idea.md) is out of date |
| Target sequences | In `data/target.fasta`, healthy checked against UniProt P0CG48 |

**Known blocker:** the ESM Atlas fold API is not folding new sequences. Probed on 28 Oct 2026 with random sequences of 12 to 76 beads, every one returned 504 after 30 seconds. Sequences it has already folded still come back instantly, which is why it can look like it works. Check whether it is back with:

```bash
python3 tools/fold.py
```

Until it returns, the agent cannot do a real run, because every mutation makes a sequence nobody has folded. The damaged sequence in `data/target.fasta` therefore has no score yet. The one damaged variant we did fold scores 86.6 against the healthy 90.5, a gap of only 3.9 points, and the demo needs nearer 15 to be visible.

## Tests

```bash
python3 tests/test_tools.py
```
