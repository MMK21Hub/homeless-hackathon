# Demo script, about 3 minutes

**Before you start:** the model is reachable (`ollama list` shows gemma4), the page is open on the damaged protein, and the backup replay is loaded in a second tab.

### 0:00 The problem (30s)

"A protein is a chain of beads that folds itself into a shape, and the shape is what makes it work. Fold it wrong and it stops working. Many genetic diseases are exactly that."

Point at the 3D view. "This is ubiquitin, a real human protein, and we have deliberately broken its core. The orange parts are where the predictor is least confident, so the chain is floppy there."

### 0:30 Why an agent (30s)

"A chatbot can explain this, but it cannot know whether a repair works. That has to be tested. So we gave Gemma 4 a structure predictor as a lab bench and let it run its own experiments."

### 1:00 Press go (90s)

Press Run. While rounds stream in, narrate what the agent actually did, not a script:

- "It looked for the weak region first, then proposed one swap and said why."
- "Score went up, so we kept it." Point at the chart.
- **Wait for a revert.** "This one made it worse, so our code threw it away and told the agent. It is now working around that." This is the moment that proves it is an agent and not a text generator.

### 2:30 What we are not claiming (30s)

"We improved a predicted confidence score, not a lab result. A real lab would test the winning sequence next. The score is the predictor's confidence in its own answer, which is a proxy for how well the chain folds, not a measurement of it."

---

## Plain answers to likely questions

**What is a protein?** A tiny machine in every living cell. It starts as a chain of beads (amino acids, 20 kinds, each written as a letter) and folds itself into a shape. The shape does the work.

**What does pLDDT mean?** How confident the structure predictor is about each bead, 0 to 100. Above 90 means it is sure that part is well folded; below 50 means floppy or disordered. We average it over the whole chain to get one number per attempt.

**Why does the agent revert changes?** Because it cannot tell in advance whether a swap helps. Our code, not the model, folds the new sequence and compares scores. If the score did not rise, the change is thrown away and the agent is told, so it stops repeating that idea.

**Why not let the model keep the state?** Small models drift over long plans. Our code holds the best sequence and the history, and each agent turn is one narrow decision.

**Is this a new protein design method?** No. It is an agent demo on top of an existing predictor. The point is the loop: investigate, act, measure, keep or undo, repeat.

**What is not claimed?** That the repaired protein works. We moved a prediction score. The next honest step is a lab test.

**Which model?** Gemma 4 running locally through Ollama, using its native function calling. No cloud AI in the loop.
