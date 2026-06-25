# Web Skill Generic Login Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use writing-skills when editing this skill.

**Goal:** Build a child skill for ordinary web login in browser automation flows.

**Architecture:** This skill performs login setup and detection only. Challenge solving remains delegated to challenge skills, and secrets remain outside logs and committed files.

**Tech Stack:** Markdown skill document, browser automation concepts shared by Puppeteer, Playwright, Chrome connector, or in-app browser tools.

---

## Task 1: Generic login skill

**Files:**

- Create: `web-skill-generic-login/SKILL.md`
- Create: `web-skill-generic-login/web-skill-generic-login.discovery.md`
- Create: `web-skill-generic-login/web-skill-generic-login.plan.v1.md`
- Create: `web-skill-generic-login/reviews/round-01.review.md`

**Steps:**

1. Document baseline failures and boundaries.
2. Write trigger-focused Chinese frontmatter.
3. Define input and output contracts.
4. Define login field discovery and success signals.
5. Define challenge handoff behavior.
6. Run frontmatter and safety checks.
7. Run `git diff --check`, review, and commit.
