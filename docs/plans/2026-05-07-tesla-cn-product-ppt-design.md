# Tesla China Product PPT Design

## Goal

Create a 36-page Chinese magazine-style web PPT introducing Tesla's China-market products, analyzing product positioning, and comparing Tesla against major local EV competitors.

## Audience And Tone

The deck is for a 30-45 minute product and industry analysis talk. The tone should be concise, editorial, and evidence-led: less sales brochure, more product strategy memo.

## Output

- Deck: `tesla-cn-product-ppt/ppt/index.html`
- Images: `tesla-cn-product-ppt/ppt/images/`
- Format: single HTML file using `guizang-ppt-skill`
- Theme: Indigo Porcelain
- Visual style: electronic magazine plus electronic ink

## Narrative

The core claim is: Tesla remains a reference product in China, but the reference has changed. Chinese competitors now attack from price, cockpit experience, assisted driving, charging speed, and ecosystem integration.

## Page Plan

1. Cover: Tesla in China
2. Core thesis: the benchmark is being redefined
3. China EV market: from range anxiety to experience competition
4. Competitive variables: price, intelligent driving, cockpit, charging, ecosystem
5. Tesla China lineup overview
6. Model 3: efficiency-first sports sedan
7. Model 3 product decomposition
8. Model 3 user profile
9. Model Y: family SUV main battlefield
10. Model Y product decomposition
11. Model Y user profile
12. Tesla common strengths
13. Tesla common weaknesses
14. Chapter: sedan battlefield
15. Model 3 vs Xiaomi SU7
16. Model 3 vs BYD Han EV
17. Model 3 vs BYD Seal / Seal 07 EV
18. Sedan conclusion
19. Chapter: SUV battlefield
20. Model Y vs Xiaomi YU7
21. Model Y vs XPeng G6
22. Model Y vs NIO ES6
23. Model Y vs Zeekr 7X
24. Model Y vs BYD Song family
25. SUV conclusion
26. Chapter: intelligence competition
27. Tesla Autopilot/FSD boundary in China
28. Local assisted-driving competition
29. Smart cockpit: minimalism vs local ecosystem
30. Chapter: charging and ecosystem
31. Tesla Supercharger network advantage
32. 800V/900V/flash charging pressure
33. Ecosystem entry: Xiaomi phone-car-home vs Tesla App
34. Strategic judgment
35. Risk list
36. Closing: from the only answer to one strong answer

## Sources

Use current official or near-primary sources:

- Tesla China product pages for Model 3 and Model Y specs.
- Tesla investor relations for production, deliveries, revenue, gross margin, and energy storage context.
- Xiaomi official event/spec pages for SU7/YU7 positioning.
- BYD official pages for Han/Seal/Song information where available.
- XPeng, NIO, Zeekr official product pages for representative SUV comparisons.
- If an official page is unavailable or dynamic, use clearly labeled third-party automotive data only for directional comparison.

## Image Plan

Generate 5-7 original images with `gpt-image-2` via the imagegen CLI fallback because the user explicitly requested that model path. Avoid brand logos and exact trademarks in generated images.

Planned assets:

- `01-cover-china-ev-night.png`
- `05-lineup-silhouettes.png`
- `14-sedan-battlefield.png`
- `19-suv-battlefield.png`
- `26-assisted-driving-sensors.png`
- `30-charging-network.png`
- `36-closing-benchmark.png`

## Verification

- Validate the deck has 36 slides.
- Check every slide has `light`, `dark`, `hero light`, or `hero dark`.
- Ensure no more than two consecutive non-hero pages use the same theme tone.
- Ensure no `[必填]` placeholder remains.
- Open the HTML in a browser or Playwright, take screenshots at desktop and mobile sizes, and fix visible overlap or blank rendering.
- Run a focused code review on generated HTML and assets before final commit.

## Commit Plan

1. Commit design document.
2. Commit generated PPT and image assets after verification.
3. Push the branch and create a PR if GitHub authentication permits.
