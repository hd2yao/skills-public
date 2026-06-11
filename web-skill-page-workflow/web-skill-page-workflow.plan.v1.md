# Web Skill Page Workflow Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use writing-skills when editing this skill.

**Goal:** Build a child skill for generic page operations and extraction.

**Architecture:** The skill converts user instructions into explicit steps with selectors or text targets, success signals, screenshots, and structured extraction outputs.

**Tech Stack:** Markdown skill document, browser automation concepts shared by Puppeteer, Playwright, Chrome connector, or in-app browser tools.

---

## Task 1: Page workflow skill

**Files:**

- Create: `web-skill-page-workflow/SKILL.md`
- Create: `web-skill-page-workflow/web-skill-page-workflow.discovery.md`
- Create: `web-skill-page-workflow/web-skill-page-workflow.plan.v1.md`
- Create: `web-skill-page-workflow/reviews/round-01.review.md`

**Steps:**

1. Document baseline failures.
2. Write Chinese trigger-focused frontmatter.
3. Define step DSL and allowed actions.
4. Define extraction output shape.
5. Define submit guard handoff.
6. Run frontmatter and safety checks.
7. Run `git diff --check`, review, and commit.
