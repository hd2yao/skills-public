# Web Skill Template Draft Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use writing-skills when editing this skill.

**Goal:** Build a child skill that drafts reusable flow skills from run records.

**Architecture:** The skill reads run evidence, removes sensitive data, extracts stable parameters and steps, and writes a reviewable skill draft plan.

**Tech Stack:** Markdown skill document and local filesystem run record conventions.

---

## Task 1: Template draft skill

**Files:**

- Create: `web-skill-template-draft/SKILL.md`
- Create: `web-skill-template-draft/web-skill-template-draft.discovery.md`
- Create: `web-skill-template-draft/web-skill-template-draft.plan.v1.md`
- Create: `web-skill-template-draft/reviews/round-01.review.md`

**Steps:**

1. Document baseline failures and boundaries.
2. Write Chinese trigger-focused frontmatter.
3. Define required run inputs.
4. Define sanitized draft output structure.
5. Define review gates before publication.
6. Run frontmatter and safety checks.
7. Run `git diff --check`, review, and commit.
