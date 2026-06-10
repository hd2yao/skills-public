# slider-captcha-browser-automation discovery

## Goal

Create a reusable skill for browser automation tasks blocked by slider / jigsaw captchas, without coupling the workflow to a single site such as `hub.51job.com`.

## Baseline Failure Before Skill

Observed in the `51job hub` login flow:

- The page used a slider puzzle instead of a text captcha.
- The available `Computer Use` tool surface in this session exposed click and keypress only, not drag.
- A site-specific manual workflow was therefore not enough to guarantee automation.
- A naive login attempt failed because the backend required successful slider verification before `loginWithSlide`.

## What Actually Generalized

The site-specific details changed, but the reusable pattern stayed stable:

1. Load the login page and fill static credentials.
2. Inspect network traffic for a captcha creation endpoint.
3. Capture the returned puzzle images, commonly as base64 data URLs.
4. Compute the best horizontal offset by comparing the cutout image against candidate background windows.
5. Drag the slider with a non-instant, human-like motion.
6. Verify success from the slider verification response, not from the UI text alone.
7. Only then submit the login form or continue the blocked action.

## Boundaries

This skill is a good fit when:

- the captcha is a horizontal slider or jigsaw puzzle
- the browser can access image data for the puzzle
- the site exposes a captcha create/verify request pair
- the protected action can be retried after verification

This skill is not enough by itself when:

- the site uses device attestation or native app checks
- the puzzle is heavily obfuscated in WebGL / canvas without recoverable image data
- the site scores advanced motion telemetry and rejects ordinary scripted drags
- the challenge requires SMS, email OTP, QR scan, or external approval

## Design Decisions For This Skill

- Keep the skill browser-automation focused rather than `51job` specific.
- Use Playwright as the default execution model because it supports network inspection, image extraction, and precise pointer motion.
- Put reusable code in `scripts/playwright-slider-solver.js`.
- Make the skill emphasize verification via network responses and hidden state, not only visual disappearance of the puzzle.
