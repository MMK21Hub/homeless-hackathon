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
| Agent loop (`agent.py`) | Built, tested against stand-in tools. Not yet run with the real ones |
| `fold()` (`tools/fold.py`) | Built, caches to `data/cache/` |
| Logic tools (`tools/`) | First versions in, signatures do not match [idea.md](idea.md) yet |
| Streamlit UI (`app.py`) | Not started |
| Target sequences | In `data/target.fasta`, healthy checked against UniProt P0CG48 |

**Known blocker:** the ESM Atlas fold API returns 504 on sequences it has not seen before, so the damaged sequence has no score yet. The one damaged variant we have folded scores 86.6 against the healthy 90.5, a gap of only 3.9 points. The demo needs a bigger gap than that to be visible.

## Team

| Name | Role |
| --- | --- |
| Joshua | Agent loop |
| Charles | `fold()` and tools |
| Louis | Logic tools |
| Tobi | Web API |
| Mish | Frontend and printing |
| Evan | Frontend |

## License

Not chosen yet — the team needs to pick one before this is shared. Note that Gemma's weights carry their own terms, so check them before redistributing anything that includes the model.
