"use strict";

function attachSliderCapture(page, options = {}) {
  const {
    createPattern = /captcha.*create/i,
    verifyPattern = /captcha.*verify/i,
    imageExtractor = extractDefaultImages,
  } = options;

  const state = {
    latestCreate: null,
    latestVerify: null,
    history: [],
  };

  page.on("response", async (response) => {
    const url = response.url();
    if (!createPattern.test(url) && !verifyPattern.test(url)) {
      return;
    }

    let bodyText = "";
    try {
      bodyText = await response.text();
    } catch (error) {
      state.history.push({
        type: "response-read-error",
        url,
        error: String(error),
      });
      return;
    }

    let payload = null;
    try {
      payload = JSON.parse(bodyText);
    } catch (error) {
      state.history.push({
        type: "response-parse-error",
        url,
        bodyText: bodyText.slice(0, 500),
        error: String(error),
      });
      return;
    }

    if (createPattern.test(url)) {
      const images = imageExtractor(payload);
      state.latestCreate = {
        url,
        payload,
        data: images,
      };
      state.history.push({
        type: "create",
        url,
        ok: true,
      });
      return;
    }

    if (verifyPattern.test(url)) {
      state.latestVerify = payload;
      state.history.push({
        type: "verify",
        url,
        ok: true,
        code: payload.code,
      });
    }
  });

  return state;
}

function extractDefaultImages(payload) {
  const data = payload && payload.data ? payload.data : {};
  const cutImage = data.cutImage || data.blockImage || data.sliderImage;
  const dealImage = data.dealImage || data.bgImage || data.backgroundImage;
  const captchaKey = data.captchaKey || data.key || null;

  if (!cutImage || !dealImage) {
    throw new Error("Captcha create payload does not expose cutImage/dealImage");
  }

  return {
    captchaKey,
    cutImage,
    dealImage,
  };
}

async function solveSliderFromResponse(page, captchaData, options = {}) {
  const {
    compensation = 25,
  } = options;

  const result = await page.evaluate(async ({ cutImage, dealImage }) => {
    function decodeToImageData(dataUrl) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0);
          resolve(context.getImageData(0, 0, canvas.width, canvas.height));
        };
        image.onerror = () => reject(new Error("Failed to decode captcha image"));
        image.src = dataUrl;
      });
    }

    const [cut, background] = await Promise.all([
      decodeToImageData(cutImage),
      decodeToImageData(dealImage),
    ]);

    const mask = [];
    for (let y = 0; y < cut.height; y += 1) {
      for (let x = 0; x < cut.width; x += 1) {
        const alpha = cut.data[(y * cut.width + x) * 4 + 3];
        if (alpha > 0) {
          mask.push([x, y]);
        }
      }
    }

    let bestX = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let offsetX = 0; offsetX <= background.width - cut.width; offsetX += 1) {
      let score = 0;
      for (const [x, y] of mask) {
        const cutIndex = (y * cut.width + x) * 4;
        const bgIndex = (y * background.width + offsetX + x) * 4;
        const dr = background.data[bgIndex] - cut.data[cutIndex];
        const dg = background.data[bgIndex + 1] - cut.data[cutIndex + 1];
        const db = background.data[bgIndex + 2] - cut.data[cutIndex + 2];
        score += dr * dr + dg * dg + db * db;
      }
      if (score < bestScore) {
        bestScore = score;
        bestX = offsetX;
      }
    }

    return {
      bestX,
      bestScore,
    };
  }, captchaData);

  return {
    ...result,
    dragDistance: result.bestX + compensation,
  };
}

async function dragSliderHandle(page, options = {}) {
  const {
    handleSelector,
    distance,
    steps = 32,
    settleDelayMs = 120,
    minStepDelayMs = 18,
    maxStepDelayMs = 26,
    jitterY = 0.6,
  } = options;

  if (!handleSelector) {
    throw new Error("handleSelector is required");
  }
  if (typeof distance !== "number") {
    throw new Error("distance must be a number");
  }

  const handle = page.locator(handleSelector).first();
  const box = await handle.boundingBox();
  if (!box) {
    throw new Error(`Could not resolve slider handle: ${handleSelector}`);
  }

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  for (let index = 1; index <= steps; index += 1) {
    const progress = index / steps;
    const x = startX + distance * progress;
    const y = startY + (index < steps - 4 ? ((index % 3) - 1) * jitterY : 0);
    await page.mouse.move(x, y, { steps: 1 });
    const delayMs = randomInt(minStepDelayMs, maxStepDelayMs);
    await page.waitForTimeout(delayMs);
  }

  await page.waitForTimeout(settleDelayMs);
  await page.mouse.up();
}

function randomInt(min, max) {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

module.exports = {
  attachSliderCapture,
  dragSliderHandle,
  extractDefaultImages,
  solveSliderFromResponse,
};
