---
name: web-skill-challenge-router
description: 适用于网页自动化流程检测到验证码、滑块、拼图、扫码、OTP、设备审批或外部授权阻塞，需要判断验证类型并选择已有验证 Skill 或人工接管的场景。
---

# Web Skill Challenge Router

这是 Web Skill Automation Hub 的验证路由子 Skill。它只负责识别验证类型和选择处理路径，不复制任何验证码求解逻辑。第一版自动处理基线只接入 `slider-captcha-browser-automation`。

开始时先说明：`我会用 web-skill-challenge-router 判断当前验证类型；如果是可处理的滑块拼图，会调用 slider-captcha-browser-automation，否则进入人工接管。`

## When to Use

使用这个 Skill 当：

- 登录、提交或页面操作被验证阻塞
- 页面出现滑块、拼图、验证码图片、短信、邮箱、扫码、设备审批或外部授权
- 主编排流程需要决定调用哪个验证 Skill
- 需要记录验证路由依据和失败后的接管方式

不要使用这个 Skill 当：

- 页面没有验证阻塞
- 目标是绕过无授权访问、规避风控或批量破解验证
- 已有站点级 Skill 明确覆盖该验证流程

## Input Contract

```json
{
  "current_url": "https://example.com/login",
  "source_step": "login",
  "challenge_hint": "optional",
  "screenshot_path": "runs/2026-06-11_001/screenshots/challenge.png",
  "page_text": "请拖动滑块完成验证",
  "dom_summary": {},
  "network_evidence": {
    "create_urls": [],
    "verify_urls": []
  },
  "max_retry": 2
}
```

证据不足时先收集截图、页面文本、DOM 摘要和关键网络请求，不要直接猜测。

## Classification

按以下信号判断：

| Signal | `challenge_type` | Route |
|---|---|---|
| horizontal slider handle, jigsaw gap, drag text | `slider_puzzle` | `slider-captcha-browser-automation` |
| arithmetic expression text or OCR result | `arithmetic` | `arithmetic-captcha-browser-automation` |
| arithmetic expression image without readable text | `arithmetic_unreadable` | `web-skill-manual-takeover` |
| image text captcha | `image_captcha` | manual until skill exists |
| SMS or phone code | `sms_otp` | `web-skill-manual-takeover` |
| email code | `email_otp` | `web-skill-manual-takeover` |
| QR scan | `qr_scan` | `web-skill-manual-takeover` |
| SSO consent, device approval, app confirmation | `external_approval` | `web-skill-manual-takeover` |
| cannot classify | `unknown` | `web-skill-manual-takeover` |

自动路由当前支持 `slider_puzzle` 和可读取文本的 `arithmetic`。其他验证类型进入人工接管。后续新增验证 Skill 时，只扩展这张表和输出路由，不修改主编排流程。

## Slider Route

只有同时满足这些条件，才调用 `slider-captcha-browser-automation`：

- 验证类型是滑块或拼图
- 浏览器能访问验证码页面
- 存在可观察的滑块句柄或拼图区域
- 有机会获取 create / verify 请求、base64 图片、canvas 图像或 DOM 资源
- 用户有权限登录或操作该网站

调用后必须要求该 Skill 返回后端验证证据，例如 verify response、隐藏字段变化、登录响应或受保护接口成功。

不要在本 Skill 中复制图片匹配、偏移计算或拖动逻辑。

## Arithmetic Route

只有同时满足这些条件，才调用 `arithmetic-captcha-browser-automation`：

- 验证类型是 100 以内加减法。
- 算式文本能从页面文本、OCR 结果、DOM 或接口响应中读取。
- 不需要识别扭曲图片文字。

如果只有图片且没有可读文本，进入 `web-skill-manual-takeover`。

## Manual Takeover

以下情况进入人工接管：

- SMS, email OTP, QR scan, app approval
- 外部 SSO 授权或设备审批
- 无法分类的验证
- 滑块资源不可访问或验证连续失败
- 网站要求真实设备手势、硬件密钥或用户线下确认

人工接管时输出：

```json
{
  "success": false,
  "challenge_type": "sms_otp",
  "selected_skill": null,
  "manual_takeover_required": true,
  "message": "请在当前浏览器窗口完成短信验证码，完成后回复我继续。"
}
```

## Output Contract

自动路由：

```json
{
  "success": true,
  "challenge_type": "slider_puzzle",
  "selected_skill": "slider-captcha-browser-automation",
  "manual_takeover_required": false,
  "routing_reason": "Detected horizontal slider and jigsaw puzzle evidence."
}
```

不支持：

```json
{
  "success": false,
  "challenge_type": "qr_scan",
  "selected_skill": null,
  "manual_takeover_required": true,
  "routing_reason": "QR scan requires user-controlled device approval."
}
```

## Common Mistakes

### Treating every captcha as a slider

只要是短信、邮箱、扫码、设备审批或外部授权，就不要调用滑块技能。

### Solving inside the router

Router 只做分类和选择。滑块求解属于 `slider-captcha-browser-automation`。

### Trusting visual disappearance

验证是否成功必须由被调用验证 Skill 或主编排流程通过后端响应、隐藏状态或后续受保护请求确认。

### Retrying without changing evidence

连续失败时要记录失败证据并人工接管，不要重复同一路由无限尝试。
