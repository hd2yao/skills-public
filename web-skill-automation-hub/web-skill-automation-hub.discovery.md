# web-skill-automation-hub discovery

## Goal

Create the V0.1 main orchestration skill for the Web Skill Automation Hub PRD. The skill should turn a user request into a browser automation run plan, select child skills, enforce safety gates, and preserve run evidence. It should start with the existing `slider-captcha-browser-automation` skill as the only automatic challenge baseline.

## PRD Scope Selected For This Repository

This repository stores Codex skills, not a full application runtime. For the first pass, the deliverable is a set of reusable skill documents and small helper scripts only when needed.

Included now:

- main orchestration skill
- skill selection rules
- run evidence conventions
- submit risk gate
- template draft handoff
- challenge routing that prefers `slider-captcha-browser-automation`

Deferred:

- local API service
- frontend UI
- SQLite or queue storage
- full Puppeteer / Playwright adapter implementation
- multi-user permission system

## Baseline Failure Before This Skill

Without a main orchestration skill, an agent is likely to:

- jump directly into browser actions without first classifying the task
- treat login, challenge solving, data extraction, and submit actions as one ad hoc flow
- retry a failed login without checking whether a challenge appeared
- trust UI disappearance of a captcha instead of backend verification
- click submit-class actions without an explicit confirmation gate
- finish with no reusable record of the steps, screenshots, or result files

## Existing Skill To Reuse

`slider-captcha-browser-automation` already defines the strongest current challenge baseline:

1. inspect captcha create and verify requests
2. extract puzzle images
3. compute horizontal offset
4. drag the handle through browser automation
5. verify success from backend responses

The hub skill should call or instruct use of that skill. It should not copy or rewrite the slider solver.

## Open Assumptions

- First validation will be done by the user providing a real URL after these skills are created.
- Credentials must be supplied through user input or environment variables, never committed.
- When a child skill is missing, the hub should produce a clear handoff plan instead of inventing implementation details.
