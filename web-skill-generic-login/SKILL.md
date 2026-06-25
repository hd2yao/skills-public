---
name: web-skill-generic-login
description: 适用于网页自动化流程需要使用用户授权的账号密码或已有登录态完成普通登录，并在遇到验证码、扫码、OTP、外部授权或登录失败时向主编排流程返回明确状态。
---

# Web Skill Generic Login

这是 Web Skill Automation Hub 的登录子 Skill。它只负责普通登录流程和登录状态判断，不负责验证码求解、扫码、短信、邮箱 OTP、设备审批或第三方授权。

开始时先说明：`我会用 web-skill-generic-login 尝试完成普通登录；如果出现验证或外部授权，我会停止并把状态交回主编排流程。`

## When to Use

使用这个 Skill 当：

- 主编排 Skill 判断目标流程需要登录
- 用户提供了账号密码、环境变量引用或已有登录态
- 目标站点是常规网页登录表单
- 需要保存登录后截图、URL 和登录态路径

不要使用这个 Skill 当：

- 用户没有权限访问目标系统
- 登录必须由扫码、短信、邮箱 OTP 或外部审批完成
- 已有站点级登录 Skill 可以更稳定地处理该网站
- 用户要求把密码写入 Skill、脚本、日志或提交记录

## Input Contract

```json
{
  "url": "https://example.com/login",
  "username": "value or env:EXAMPLE_USERNAME",
  "password": "value or env:EXAMPLE_PASSWORD",
  "login_state": {
    "enabled": true,
    "profile_name": "example_admin"
  },
  "site_profile": "optional",
  "max_retry": 1
}
```

如果用户提供 `env:NAME`，只读取环境变量值用于填写页面，不要把真实值写入日志或结果。

## Output Contract

```json
{
  "success": true,
  "current_url": "https://example.com/dashboard",
  "login_state_path": "profiles/example_admin/storage-state.json",
  "challenge_detected": false,
  "challenge_type": null,
  "failure_reason": null,
  "screenshots": [
    "runs/2026-06-11_001/screenshots/login_page.png",
    "runs/2026-06-11_001/screenshots/after_login.png"
  ]
}
```

如果出现验证：

```json
{
  "success": false,
  "challenge_detected": true,
  "challenge_type": "slider_puzzle",
  "current_url": "https://example.com/login",
  "failure_reason": "challenge_required",
  "screenshots": ["runs/2026-06-11_001/screenshots/challenge.png"]
}
```

## Workflow

1. Open the login URL.
   截图并记录当前 URL。先判断是否已经登录，避免重复提交登录表单。

2. Load existing login state if requested.
   如果 profile 或 storage state 可用，加载后访问目标 URL，并用成功信号确认登录态有效。

3. Locate fields conservatively.
   优先使用稳定语义：
   - label text
   - placeholder
   - input `name`
   - input `type=email`, `type=text`, `type=password`
   - ARIA role and accessible name

4. Fill credentials.
   不在日志中输出真实用户名之外的敏感字段；密码永远记录为 `<redacted>`。

5. Submit once.
   点击登录按钮或提交表单后等待导航、网络空闲、错误提示或验证弹层。不要连续猛点登录按钮。

6. Detect challenge.
   如果出现滑块、拼图、验证码图片、短信、邮箱、扫码、设备审批或外部授权，停止登录流程并返回 `challenge_detected: true`。

7. Determine success.
   至少使用两个信号：
   - URL 离开登录页
   - 登录表单消失
   - 用户名、头像、菜单、退出按钮或后台首页出现
   - 受保护接口返回成功

8. Save evidence.
   保存登录后截图、当前 URL 和登录态路径引用。不要保存凭据。

## Challenge Handoff

按以下规则返回类型：

| Signal | `challenge_type` |
|---|---|
| horizontal slider, jigsaw gap, drag handle | `slider_puzzle` |
| arithmetic expression image or text | `arithmetic` |
| SMS or phone code | `sms_otp` |
| email code | `email_otp` |
| QR scan | `qr_scan` |
| device approval or SSO consent | `external_approval` |
| unknown blocking challenge | `unknown` |

主编排 Skill 只应把 `slider_puzzle` 交给 `slider-captcha-browser-automation`。其他类型默认人工接管，直到新增对应验证 Skill。

## Failure Handling

- 字段找不到：截图、保存 DOM 摘要、列出候选字段，返回 `failure_reason: "login_fields_not_found"`。
- 凭据错误：截图并返回页面错误文本，但不要回显密码。
- 登录态过期：清楚标记 `failure_reason: "login_state_expired"`，再按用户授权尝试账号密码登录。
- 验证出现：停止重复登录，返回 challenge handoff。
- 网络或页面加载失败：按主编排给定重试次数重试；仍失败时返回错误报告。

## Common Mistakes

### Solving captcha inside the login skill

登录 Skill 只检测验证并交回主编排。不要在这里复制滑块、算术或 OCR 逻辑。

### Logging credentials for debugging

密码、Cookie、Token、验证码和环境变量值不能出现在日志、截图说明或提交记录中。

### Treating every failure as wrong credentials

先检查挑战、加载中状态、SSO 跳转、账号锁定和字段识别错误，再判断是否凭据错误。

### Retrying after a challenge appears

验证码出现后继续点击登录通常会刷新挑战或触发风控。应停止并返回 handoff。
