---
name: slider-captcha-browser-automation
description: 适用于浏览器自动化在登录或提交表单时被滑块或拼图验证码阻塞，尤其是页面暴露验证码创建、校验请求，或返回 base64、canvas 形式的拼图资源时。
---

# Slider Captcha Browser Automation

Use this skill when a browser workflow is blocked by a horizontal slider puzzle. The core pattern is: inspect the captcha API, solve the offset from the returned images, drag the slider, and trust backend verification more than UI text.

Announce at start: `I'm using slider-captcha-browser-automation to inspect the captcha flow, solve the slider offset, and verify success from the network responses.`

## When to Use

Use this skill when:

- login or submission fails until a slider / jigsaw puzzle is solved
- the site exposes create and verify requests for the captcha
- the captcha images are available as base64, data URLs, or readable DOM assets
- `Computer Use` is missing drag support or is too brittle for repeated use
- the user wants a reusable automation path rather than one-off manual clicking

Do not use this skill when:

- the challenge is SMS, email OTP, QR scan, or an external approval flow
- the site requires a real human device gesture that cannot be reproduced from recoverable image data
- the captcha is already handled by a better site-specific skill

## Quick Reference

| Stage | What to inspect | Success signal |
|---|---|---|
| Discover | Network requests after page load or first click | Create and verify endpoints identified |
| Capture | Response body from captcha create request | Background and cutout images available |
| Solve | Horizontal image matching | Best offset computed |
| Drag | Slider handle motion | Verify request sent with computed offset |
| Validate | Verify response and hidden form state | Backend says success |
| Continue | Login or protected action request | Token, redirect, or success payload returned |

## Workflow

1. Reproduce the blocked flow with browser automation.
   Fill stable fields first, but do not hardcode the captcha logic until the request pattern is understood.

2. Identify the captcha contract.
   Record:
   - create endpoint URL
   - verify endpoint URL
   - request method and payload
   - captcha key or session ID field
   - where the images come from

3. Confirm whether the site is in the "solvable" class.
   Good signs:
   - create response returns `cutImage` and `dealImage`
   - verify request uses only `x` or another simple horizontal offset
   - the login call depends on the verified captcha key

4. Compute the offset from the images.
   Use the helper in [scripts/playwright-slider-solver.js](/Users/dysania/program/skills/slider-captcha-browser-automation/scripts/playwright-slider-solver.js).
   The helper:
   - decodes data URLs
   - builds a mask from non-transparent cutout pixels
   - scores each candidate horizontal position against the background
   - returns the best offset and a drag distance

5. Drag the slider with motion that looks continuous.
   Do not jump directly to the final coordinate. Move in small steps with small jitter and short waits.

6. Verify with backend evidence.
   Prefer:
   - verify response body
   - hidden field changes
   - login response token
   - post-login identity request

7. Only then submit or retry the protected action.
   If login still fails after slider verification succeeds, inspect the action request separately. Do not assume the solver is wrong.

## Playwright Pattern

Use this sequence in order. Prefer `solveSliderWithRetries` for sites that recreate the captcha after a failed verify response:

```js
const { attachSliderCapture, solveSliderWithRetries } =
  require("./scripts/playwright-slider-solver");

let sliderState = attachSliderCapture(page, {
  createPattern: /captchaSlideCreate/i,
  verifyPattern: /captchaSlideVerify/i,
});

await page.goto(loginUrl, { waitUntil: "networkidle" });
await page.getByPlaceholder("邮箱").fill(username);
await page.getByPlaceholder("密码").fill(password);

const result = await solveSliderWithRetries(page, sliderState, {
  handleSelector: ".loginMain .slider",
  compensationCandidates: [0, 25, -5],
  maxAttempts: 3,
});

if (!result.success) {
  throw new Error("Slider verification failed");
}
```

## Site Adaptation Checklist

For a new site, adapt only these variables first:

- selector for the slider handle
- create endpoint pattern
- verify endpoint pattern
- response field names for the images
- drag compensation candidates if the site measures center vs left edge differently

Do not rewrite the whole workflow before checking whether the site already matches the generic helper assumptions.

## Common Mistakes

### Trusting UI text instead of the verify response

The puzzle may disappear visually while backend verification still fails. Always capture the verify response.

### Clicking login before verification settles

Some sites recreate the captcha or reject the action if login is submitted too early. Wait for verify success first.

### Using the first computed offset without compensation

The raw image match often identifies the left edge of the target gap. Some sites expect the handle center or another shifted coordinate. Tune a small compensation term before rewriting the matcher.

For repeated automation, do not rely on a single fixed compensation. Use a short ordered candidate list such as `[0, 25, -5]` and verify each attempt from the backend response. Stop after the configured attempt limit and hand off instead of looping indefinitely.

### Treating every failure as an image-matching problem

If `captchaSlideVerify` succeeds but `loginWithSlide` fails, the issue may be payload order, stale captcha key, extra hidden inputs, or race timing.

### Overfitting to one site

Keep site-specific values in a small adapter layer. The reusable logic is image extraction, offset scoring, drag motion, and backend verification.

## Validation

Before claiming the skill works for a site, confirm all of these:

- create response captured
- images decoded successfully
- verify request sent
- verify response shows success
- protected action succeeds after verification

For login flows, also confirm one authenticated follow-up request such as profile, requester info, or menu data.
