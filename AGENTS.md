# Agent instructions

The working rules for this repository live in [CLAUDE.md](CLAUDE.md). Read that file first —
it is kept as the single copy so the guidance cannot drift between tools.

Start with the parity rule at the top: every API behaviour is implemented twice, once in FastAPI and
once in a TypeScript engine, and changing only one side ships a broken deployment.
