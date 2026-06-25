# web-skill-generic-login discovery

## Goal

Create a generic login child skill for the Web Skill Automation Hub. The skill should cover ordinary username/password login and return clear handoff signals when a challenge, OTP, QR scan, or external authorization appears.

## Baseline Failure Before This Skill

Without a generic login skill, an agent may:

- hardcode selectors too early without inspecting labels, placeholders, roles, and form structure
- log credentials while describing the run
- keep clicking the login button after a captcha appears
- assume a failed login means wrong password instead of checking challenge state
- finish without saving login-state evidence or post-login success signals

## Boundaries

This skill handles:

- opening login pages
- filling username and password fields
- submitting the login form
- detecting whether login succeeded
- detecting challenge handoff conditions
- saving screenshots and login state path references

It does not solve captchas, OTP, QR scan, device approvals, or third-party authorization flows.

## Integration Notes

The main hub should call this skill before page operations when no usable login state exists. If the output includes `challenge_detected: true`, the hub should route to `slider-captcha-browser-automation` only when the challenge is a slider puzzle; otherwise it should ask for manual takeover.
