# Web Skill Challenge Router Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use writing-skills when editing this skill.

**Goal:** Build a child skill that routes detected web challenges to the right verification skill or manual takeover.

**Architecture:** The skill takes challenge evidence, classifies type, selects a matching challenge skill, and returns routing output without duplicating solver logic.

**Tech Stack:** Markdown skill document, existing `slider-captcha-browser-automation` skill.

---

## Task 1: Challenge router skill

**Files:**

- Create: `web-skill-challenge-router/SKILL.md`
- Create: `web-skill-challenge-router/web-skill-challenge-router.discovery.md`
- Create: `web-skill-challenge-router/web-skill-challenge-router.plan.v1.md`
- Create: `web-skill-challenge-router/reviews/round-01.review.md`
- Modify: `web-skill-automation-hub/SKILL.md`

**Steps:**

1. Document baseline failures and boundaries.
2. Write Chinese trigger-focused frontmatter.
3. Define challenge evidence inputs.
4. Define slider routing to `slider-captcha-browser-automation`.
5. Define manual takeover for unsupported challenge types.
6. Update the main hub child skill table.
7. Run frontmatter and integration checks.
8. Run `git diff --check`, review, and commit.
