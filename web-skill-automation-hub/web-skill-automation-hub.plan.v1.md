# Web Skill Automation Hub Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use writing-skills when editing this skill.

**Goal:** Build a V0.1 main skill that orchestrates existing and future web automation skills from a user task.

**Architecture:** The main skill is a planner and dispatcher. It normalizes input, classifies risk, chooses child skills by capability, records evidence, and stops for confirmation or manual takeover when automation is unsafe or unsupported.

**Tech Stack:** Markdown skill document, local filesystem run records, existing browser automation skills such as `slider-captcha-browser-automation`.

---

## Task 1: Main orchestration skill

**Files:**

- Create: `web-skill-automation-hub/SKILL.md`
- Create: `web-skill-automation-hub/web-skill-automation-hub.discovery.md`
- Create: `web-skill-automation-hub/web-skill-automation-hub.plan.v1.md`
- Create: `web-skill-automation-hub/reviews/round-01.review.md`

**Steps:**

1. Document the selected V0.1 scope from the PRD.
2. Write baseline failure notes before the skill.
3. Write the main `SKILL.md` with Chinese frontmatter description.
4. Reference `slider-captcha-browser-automation` as the first automatic challenge skill.
5. Add validation checks for frontmatter, scope, and risk gates.
6. Run `git diff --check`.
7. Review the diff and commit this skill as one unit.

## Task 2: Follow-up child skills

Create each child skill in a separate directory and commit:

- `web-skill-generic-login`
- `web-skill-page-workflow`
- `web-skill-submit-guard`
- `web-skill-template-draft`

Each child skill should be independently reviewable and should not depend on a local service or frontend.
