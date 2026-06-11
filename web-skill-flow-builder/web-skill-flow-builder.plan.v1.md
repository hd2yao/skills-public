# Web Skill Flow Builder Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use writing-skills when editing this skill.

**Goal:** Build a child skill that creates site/process-specific flow skill drafts from user descriptions, screenshots, and run records.

**Architecture:** The flow builder sits below the main hub and above concrete generated flow skills. It reuses generic child skills and emits one targeted flow skill draft per stable reusable workflow.

**Tech Stack:** Markdown skill document and local skill directory conventions.

---

## Task 1: Flow builder skill

**Files:**

- Create: `web-skill-flow-builder/SKILL.md`
- Create: `web-skill-flow-builder/web-skill-flow-builder.discovery.md`
- Create: `web-skill-flow-builder/web-skill-flow-builder.plan.v1.md`
- Create: `web-skill-flow-builder/reviews/round-01.review.md`
- Modify: `web-skill-automation-hub/SKILL.md`
- Modify: `web-skill-template-draft/SKILL.md`

**Steps:**

1. Document the generic-vs-process skill architecture.
2. Write Chinese trigger-focused frontmatter.
3. Define when to run generic skills vs create a process child skill.
4. Define generated child skill structure.
5. Define validation and publication gates.
6. Update main hub and template draft references.
7. Run frontmatter and integration checks.
8. Run `git diff --check`, review, and commit.
