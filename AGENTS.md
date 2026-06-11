# Project rules for `/Users/dysania/program/skills`

These rules are additive to the global `~/.codex/AGENTS.md`.

## Skill directory workflow
- Every new skill starts by creating a dedicated subdirectory in the repository root.
- The subdirectory name must use the skill slug exactly: `./<skill-slug>/`.
- Do not start discovery, planning, review, or implementation files before the `./<skill-slug>/` directory exists.

## File placement
- Keep all files for a skill inside its own `./<skill-slug>/` directory.
- Do not write discovery, plan, review, validation, or handoff files to the repository root.
- Place all `discovery`, `plan`, and `review` outputs under the same `./<skill-slug>/` directory used for that skill.

## Skill description style
- Write visible skill descriptions in Chinese.
- This rule applies to `SKILL.md` frontmatter `description` and agent-facing copy such as `short_description` or similar summary text.
- Describe triggering conditions and scope; do not spend the description on workflow details.
- Do not frame a skill as exclusive to a single AI Agent brand unless that exclusivity is technically required.
- When platform constraints must be mentioned, prefer neutral wording or list multiple examples such as `Claude Code`, `Codex`, and `Cursor` instead of exposing only one brand.

## Expected structure
- Each skill directory should contain `SKILL.md` as the final skill document.
- Use `./<skill-slug>/reviews/` for review round artifacts.
- Use `./<skill-slug>/artifacts/` for screenshots, verification notes, or other supporting materials when needed.
- Name working markdown files with the skill slug prefix when practical, for example:
  - `./<skill-slug>/<skill-slug>.discovery.md`
  - `./<skill-slug>/<skill-slug>.plan.v1.md`
  - `./<skill-slug>/reviews/round-01.review.md`

## Repository hygiene
- The repository root should stay readable; avoid scattering one-off workflow files outside the skill directory.
- If an existing skill is being updated, reuse its current `./<skill-slug>/` directory instead of creating a second container.
