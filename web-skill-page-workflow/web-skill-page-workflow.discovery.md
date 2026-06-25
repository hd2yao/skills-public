# web-skill-page-workflow discovery

## Goal

Create a generic page workflow child skill for navigation, clicks, form filling, waits, pagination, and data extraction in the Web Skill Automation Hub.

## Baseline Failure Before This Skill

Without this skill, an agent may:

- execute natural-language page instructions without a step list
- click by visual guess before checking text, role, and DOM context
- continue after navigation without waiting for the page to settle
- extract visible data without preserving columns, source URL, or screenshot evidence
- accidentally click final submit buttons during a read or fill task

## Boundaries

This skill can perform low-risk page operations and extraction. It must stop before submit-class actions and return a `submit_guard_required` signal.

## Integration Notes

The main hub should call this skill after login and challenge handling. If the workflow produces a `submit_guard_required` output, the main hub should route to `web-skill-submit-guard` before any final click.
