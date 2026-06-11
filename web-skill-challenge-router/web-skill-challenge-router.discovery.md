# web-skill-challenge-router discovery

## Goal

Create a challenge routing child skill for the Web Skill Automation Hub. The first automatic route should be the existing `slider-captcha-browser-automation` skill; other challenge types should stop for manual takeover until a matching skill exists.

## Baseline Failure Before This Skill

Without a challenge router, an agent may:

- call a slider solver for SMS, email OTP, QR scan, or external approval
- retry login repeatedly instead of classifying the challenge
- copy captcha-solving logic into multiple skills
- fail to record why a challenge was considered automatable or manual-only
- make future challenge additions require changes to the main orchestrator

## Boundaries

This skill classifies and routes challenges. It does not solve a challenge itself.

## Integration Notes

The main hub should call this skill when login, submit, or page workflow reports a challenge. The router should choose `slider-captcha-browser-automation` only for horizontal slider or jigsaw puzzle challenges with recoverable browser evidence.
