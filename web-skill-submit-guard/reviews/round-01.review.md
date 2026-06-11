# Review Round 01

Reviewer: Codex

## Scope

- `web-skill-submit-guard/SKILL.md`
- `web-skill-submit-guard/web-skill-submit-guard.discovery.md`
- `web-skill-submit-guard/web-skill-submit-guard.plan.v1.md`

## Checks Performed

- Verify frontmatter uses only `name` and `description`.
- Verify description is Chinese and trigger-focused.
- Verify confirmation is separate from `allow_submit`.
- Verify before and after screenshots are required.
- Verify automatic repeated submit is forbidden.
- Run `git diff --check`.

## Findings

No blocking issues found.

## Residual Risk

- Confirmation wording may need site-specific policy in regulated workflows.
- Some sites may submit through keyboard shortcuts or autosave patterns that require a site-specific guard.
