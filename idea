# Fold Rescue

An AI agent that repairs a broken protein by trial and error, using a structure predictor as its lab bench. Built for the Gemma hackathon with Gemma 4 and native function calling.

> AlphaFold turned protein shape from a lab experiment into a prediction. Fold Rescue uses that kind of prediction as a virtual lab bench and lets an agent run the experiments.

## New to proteins? Start here

A **protein** is a tiny machine built by every living cell. It starts as a chain of building blocks called **amino acids**, like beads on a necklace. There are 20 kinds of bead, so a protein can be written as a string of letters (its **sequence**).

The chain folds by itself into a precise 3D shape, and the shape is what makes the machine work. If it folds badly, it stops working. Many genetic diseases are simply a protein that folds wrong.

Some beads are oily and tuck into the core; others love water and sit on the outside. Swap an oily core bead for a water-loving one and the fold can fall apart. That is the failure this project repairs.

| Term | Plain meaning |
| --- | --- |
| Amino acid | One bead in the chain (20 types, each a letter) |
| Sequence | The full string of letters that defines a protein |
| Fold | The 3D shape the chain settles into |
| Mutation | Swapping one letter for another, e.g. `L45D` = position 45 changes from L to D |
| Structure predictor | Software that predicts the fold from the sequence (AlphaFold, ESMFold) |
| pLDDT | Predictor confidence per bead, 0 to 100. Above 90 = well folded, below 50 = floppy |
| Agent | An AI that picks its own next step, runs tools, reads results and repeats |
| Tool call | The AI asking our code to run a function and return the answer |

## What it does

We take a small, well-known protein (first target: ubiquitin, 76 beads), deliberately damage its core, then let a Gemma 4 agent repair it one mutation at a time for about 10 rounds.

Each round:

1. `fold(sequence)` returns a 3D shape and a pLDDT score for every bead.
2. `find_weak_regions()` finds the least confident stretch.
3. The agent proposes one mutation there and explains why in a sentence or two.
4. Our code applies it and folds the new sequence.
5. If average pLDDT rose, the change is kept. If not, it is reverted and the agent is told.
6. The agent updates its theory and goes again.

The UI shows the 3D shape improving, a score chart climbing, and the agent's running commentary.

## Why an agent?

A chatbot can explain proteins, but it cannot know whether a mutation improves folding. That has to be tested. Here the predictor is the environment, the score is the feedback, and each decision depends on the last result.

## Architecture

| Piece | What it does | Built with |
| --- | --- | --- |
| `fold(sequence)` | Sends letters to the predictor, returns shape and per-bead pLDDT | ESMFold API, cached |
| `find_weak_regions()` | Finds stretches with pLDDT below 70 | Python |
| `apply_mutation(seq, position, new_letter)` | Returns the edited sequence, rejects invalid input | Python |
| `commit_or_revert()` | Keeps a change only if average pLDDT rose, logs the decision | Python |
| Agent brain | Chooses the next mutation and explains it | Gemma 4 via Ollama, function calling |
| UI | 3D view, score chart, commentary feed | Streamlit, py3Dmol |

Our code, not the model, holds the state (best sequence so far, attempt history). Small models drift on long plans, so each agent step stays narrow and rounds are capped.

## Getting started

> Status: hackathon project in progress. Commands below are the intended setup; adjust to match the repo as it lands.

```bash
# 1. Run Gemma 4 locally
ollama run gemma4

# 2. Install dependencies
pip install -r requirements.txt

# 3. Launch the app
streamlit run app.py
```

Before anything else, check the fold API's current URL, sequence length limit and response format against its documentation.

## Suggested repo layout

```
.
├── app.py              # Streamlit UI
├── agent.py            # Gemma 4 tool-calling loop
├── tools/
│   ├── fold.py
│   ├── weak_regions.py
│   ├── mutate.py
│   └── commit.py
├── data/
│   ├── target.fasta    # healthy and damaged sequences
│   └── cache/          # cached folds and a backup run
├── requirements.txt
└── README.md
```

## Known limitations

- **Scores are predictor confidence, not lab results.** Structure predictors were built to predict shape, not stability, so a lightly damaged protein may still score high. We check the gap between healthy and damaged scores first and damage the protein more if needed.
- We improved a predicted score. A real lab would need to test the winning sequence.
- The public fold API may be rate-limited, so results are cached and a backup run can be replayed offline.

## Demo

About 3 minutes: show the damaged protein as a floppy low-score tangle, press go, watch the shape tighten and the score climb, including at least one reverted mistake.

## Team

Add names and roles here.

## License

Add a license. Note that Gemma weights have their own terms, so check them before redistributing.
