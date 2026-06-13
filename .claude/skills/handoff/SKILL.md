---
name: handoff
description: Write a short session handoff note (HANDOFF.md) capturing current state, blockers, and next steps for the next session — without writing to the persistent memory system.
---

# Handoff

Overwrite `HANDOFF.md` at the project root with a terse, current-state-only
note so the next session can pick up immediately. This file replaces
memory writes for session continuity — it is the single source of truth
for "where things stand," and it is disposable (overwrite fully each time,
never append, never accumulate history).

## Include only

- **Task**: one line — what's being worked on (reference AGENTS.md phase/step if applicable)
- **Status**: one or two lines — what's done vs. in progress
- **Blocker** (if any): the specific issue, what's been tried, what unblocks it
- **Next step**: one or two concrete actions

Target ~10-15 lines total. No history, no narrative, no restating CLAUDE.md/AGENTS.md content.

## Do not

- Do NOT write or update anything under the persistent memory directory
  (`~/.claude/projects/*/memory/`) as part of a handoff.
- Do NOT add entries to MEMORY.md.
- Do NOT create additional handoff/summary files — one `HANDOFF.md`, overwritten.
