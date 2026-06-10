# Tesla China Product PPT Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a verified 36-page Chinese magazine-style HTML PPT about Tesla's China-market products and competitive position.

**Architecture:** Copy the `guizang-ppt-skill` HTML template, replace the demo deck with 36 curated slides, and store generated raster assets beside the HTML. Keep the artifact static and portable: one HTML file plus local image assets.

**Tech Stack:** Static HTML/CSS/JS from `guizang-ppt-skill`, GPT image generation through the imagegen CLI fallback with `gpt-image-2`, shell checks, and browser screenshot validation.

---

### Task 1: Source Pack

**Files:**
- Create: `tesla-cn-product-ppt/sources.md`

**Step 1: Collect current source facts**

Use official or near-primary sources for:
- Tesla China Model 3 and Model Y specs.
- Tesla IR Q1 2026 delivery data and 2025 annual report numbers.
- Xiaomi YU7/SU7 public specs.
- BYD, XPeng, NIO, Zeekr representative product specs.

**Step 2: Write the source pack**

Create `tesla-cn-product-ppt/sources.md` with short bullets and URLs. Include only facts used in the deck.

**Step 3: Verify**

Run:

```bash
test -s tesla-cn-product-ppt/sources.md
rg "https?://" tesla-cn-product-ppt/sources.md
```

Expected: file exists and contains source URLs.

**Step 4: Commit**

```bash
git add tesla-cn-product-ppt/sources.md
git commit -m "docs: add tesla china ppt source pack"
```

### Task 2: Image Assets

**Files:**
- Create: `tesla-cn-product-ppt/ppt/images/*.png`

**Step 1: Generate assets**

Use the imagegen CLI fallback with `gpt-image-2` because the user explicitly requested that model path. Generate:
- `01-cover-china-ev-night.png`
- `05-lineup-silhouettes.png`
- `14-sedan-battlefield.png`
- `19-suv-battlefield.png`
- `26-assisted-driving-sensors.png`
- `30-charging-network.png`
- `36-closing-benchmark.png`

**Step 2: Verify**

Run:

```bash
find tesla-cn-product-ppt/ppt/images -type f -name "*.png" | sort
```

Expected: seven PNG files.

**Step 3: Commit**

```bash
git add tesla-cn-product-ppt/ppt/images
git commit -m "art: add tesla china ppt image assets"
```

### Task 3: HTML Deck

**Files:**
- Create: `tesla-cn-product-ppt/ppt/index.html`

**Step 1: Copy template**

Copy:

```bash
cp /Users/dysania/.codex/skills/guizang-ppt-skill/assets/template.html tesla-cn-product-ppt/ppt/index.html
```

**Step 2: Replace theme and title**

Use the Indigo Porcelain theme values from `references/themes.md`. Replace the template title with `Tesla 在中国 · 产品与竞品分析`.

**Step 3: Replace slides**

Replace the demo `<main id="deck">` content with the 36-page slide plan. Use only classes defined in the template or inline styles for slide-specific adjustments.

**Step 4: Verify static structure**

Run:

```bash
rg -n "\\[必填\\]|class=\"slide" tesla-cn-product-ppt/ppt/index.html
python3 - <<'PY'
from pathlib import Path
html = Path("tesla-cn-product-ppt/ppt/index.html").read_text()
count = html.count('class="slide')
print(count)
raise SystemExit(0 if count == 36 and "[必填]" not in html else 1)
PY
```

Expected: 36 slides and no required placeholder.

**Step 5: Commit**

```bash
git add tesla-cn-product-ppt/ppt/index.html
git commit -m "feat: add tesla china magazine ppt"
```

### Task 4: Browser Validation

**Files:**
- Create: `tesla-cn-product-ppt/ppt/screenshots/desktop.png`
- Create: `tesla-cn-product-ppt/ppt/screenshots/mobile.png`

**Step 1: Open and screenshot**

Use browser automation or Playwright against the local file URL. Capture desktop and mobile screenshots.

**Step 2: Inspect for visual issues**

Check for blank canvas, overlapping text, missing images, unreadable dense pages, and broken navigation.

**Step 3: Fix any issue**

Patch `index.html` only if validation finds visible problems.

**Step 4: Verify**

Run:

```bash
test -s tesla-cn-product-ppt/ppt/screenshots/desktop.png
test -s tesla-cn-product-ppt/ppt/screenshots/mobile.png
```

Expected: screenshots exist and are non-empty.

**Step 5: Commit**

```bash
git add tesla-cn-product-ppt/ppt/index.html tesla-cn-product-ppt/ppt/screenshots
git commit -m "test: verify tesla china ppt rendering"
```

### Task 5: Final Review And Integration

**Files:**
- Review all files changed in the branch.

**Step 1: Run final checks**

Run:

```bash
git status --short
git log --oneline master..HEAD
```

**Step 2: Focused code/content review**

Review:
- Slide count and theme rhythm.
- Source claims versus `sources.md`.
- Local image references.
- No accidental secrets or unrelated files.

**Step 3: Push and PR if possible**

Run:

```bash
git push -u origin codex/tesla-cn-ppt
```

Then create a PR if GitHub tooling is authenticated.
