# Phase 1: Workspace Boundary & Root Safety - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 01-workspace-boundary-root-safety
**Areas discussed:** Workspace entry, restore behavior, invalid workspace handling, external links

---

## Workspace Entry

| Option | Description | Selected |
|--------|-------------|----------|
| A | Pure welcome state with one primary "choose workspace directory" action | ✓ |
| B | Welcome state plus a short explanation of root-bound behavior | |
| C | Custom layout described by user | |

**User's choice:** A
**Notes:** User wants first launch to open into a directory-selection interface rather than a richer onboarding flow.

---

## Restore Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| A | Restore the previous workspace automatically with no confirmation | ✓ |
| B | Restore automatically but show a light non-blocking notice | |
| C | Ask for confirmation on every relaunch | |

**User's choice:** A
**Notes:** Relaunch should go straight back to the previous path.

---

## Invalid Workspace Handling

| Option | Description | Selected |
|--------|-------------|----------|
| A | Enter a blocked invalid-workspace state and require reselection | ✓ |
| B | Silently clear the saved path and return to the first-launch welcome state | |
| C | Prompt with retry / reselect / clear options | |

**User's choice:** A
**Notes:** If the saved root no longer works, the app should not silently discard it.

---

## External Links

| Option | Description | Selected |
|--------|-------------|----------|
| A | Show entries that resolve outside the workspace as visible but non-interactive external-link nodes | ✓ |
| B | Allow reading content outside the root while still blocking write operations | |
| C | Use a different rule described by the user | |

**User's choice:** A
**Notes:** The user first floated partial read access for linked images or content outside the root. After reviewing the consistency risk, they accepted the stricter visible-but-non-interactive rule.

---

## the agent's Discretion

- Exact UI surface for out-of-root rejection states
- Exact copy and visual treatment for welcome and invalid-workspace states
- Exact iconography for external-link nodes

## Deferred Ideas

None.
