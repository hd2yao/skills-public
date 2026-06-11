# Live 51job Slider Validation

Date: 2026-06-11

## Scope

Validate `solveSliderWithRetries` against the 51job slider captcha using fresh temporary Chrome profiles.

The validation intentionally covers only `captchaSlideCreate` and `captchaSlideVerify`; no credential values are recorded and no login submit is required for this captcha-specific check.

## Result

| Round | Outcome | Attempts | Successful compensation | Verify code | Verify info |
|---|---:|---:|---:|---|---|
| probe-1 | pass | 1 | 0 | 000000 | 校验成功 |
| repeat-1 | pass | 3 | -5 | 000000 | 校验成功 |
| repeat-2 | pass | 1 | 0 | 000000 | 校验成功 |
| repeat-3 | pass | 1 | 0 | 000000 | 校验成功 |

## Notes

- `repeat-1` failed the first two compensation candidates and succeeded on the third candidate, which validates the bounded retry path.
- All runs used new temporary browser profiles and backend verification as the success signal.
- The solver stops at `maxAttempts`; it does not loop indefinitely.
