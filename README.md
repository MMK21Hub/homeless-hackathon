# AlphaRefold

This was our submission for the [Hacktoberfest Hack Day Loughborough][1] (2026), a 2-hour local AI hackathon hosted by [Loughborough DigiTech][2].

[1]: https://events.mlh.com/events/15347-hacktoberfest-hack-day-loughborough-x-digital-technologies-network-digitech
[2]: https://www.lboro.ac.uk/departments/compsci/innovation/digital-technologies-network/

## The idea and project

Protein folding is cool. What if we gave an AI agent a broken protein, and let it iteratively mutate it and call AlphaFold to get it to a well-formed protein? As it works, a rendering of the protein-in-progress will be printed on a MXW01 cat printer.

In 2 hours, we made a tool-calling harness for Gemma 4 26B, a Next.js frontend, a Python backend to do the protein folding, and some TypeScript code for printing to the cat printer from the browser.

Unfortunately, in true software development fashion, we weren't able to put all the parts together in time for submission, so there's no shippable form of this project.

## More info

Beware that the rest of the markdown files are mostly or fully AI generated, but if you want to take a look:

- [about.md](about.md) has more technical info about the project
- [idea.md](idea.md) has details of the idea, and an implementation plan
- [issues.md](issues.md) contains tasks that need to be completed
- [DEMO.md](DEMO.md) has guidance on demo-ing the project

## Team roles

| Name | Role |
| ---- | ---- |
| Joshua | Agent loop |
| Charles | `fold()` and tools |
| Louis | Logic tools |
| Tobi | Web API |
| Mish | Cat printer |
| Evan | Frontend |
