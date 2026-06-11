# Web Skill Submit Guard Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use writing-skills when editing this skill.

**Goal:** Build a child skill that gates final submit-class browser actions.

**Architecture:** The skill validates user permission, prepares a confirmation summary, waits for explicit confirmation, performs one action, and records before/after evidence.

**Tech Stack:** Markdown skill document, browser automation concepts shared by Puppeteer, Playwright, Chrome connector, or in-app browser tools.

---

## Task 1: Submit guard skill

**Files:**

- Create: `web-skill-submit-guard/SKILL.md`
- Create: `web-skill-submit-guard/web-skill-submit-guard.discovery.md`
- Create: `web-skill-submit-guard/web-skill-submit-guard.plan.v1.md`
- Create: `web-skill-submit-guard/reviews/round-01.review.md`

**Steps:**

1. Document baseline failures and risk boundaries.
2. Write Chinese trigger-focused frontmatter.
3. Define high-risk action list.
4. Define confirmation payload and output contract.
5. Define no-repeat-submit rule.
6. Run frontmatter and safety checks.
7. Run `git diff --check`, review, and commit.
