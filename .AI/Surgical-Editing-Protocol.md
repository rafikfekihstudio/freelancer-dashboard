# Surgical Editing Protocol

## Mission

Perform isolated modifications safely.

Goal:
minimal disruption
zero regressions
small diffs

---

# Editing Rules

Touch only what must be touched.

Do NOT:
- reformat adjacent code
- refactor stable systems
- rewrite unrelated logic

Match:
- existing style
- existing architecture
- existing conventions

---

# Impact Analysis

Before editing:
- read PROJECT_MAP.md
- identify affected flows
- identify dependencies
- estimate regression risk

---

# Verification

Workflow:
1. define success criteria
2. write/update tests
3. verify failure
4. implement
5. verify success
6. run regression checks

---

# Cleanup Rules

Clean only:
- orphan imports
- dead logic
- duplicate code

created by your modification.