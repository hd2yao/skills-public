---
name: arithmetic-captcha-browser-automation
description: 适用于用户授权的网页登录或提交流程被 100 以内加减法验证码阻塞，且页面文本、OCR 结果或可访问 DOM 中已经能读取算式内容的场景。
---

# Arithmetic Captcha Browser Automation

这是 Web Skill Automation Hub 的算术验证码子技能。它只处理可读取文本中的简单加减法，不做图片验证码破解；如果无法从页面文本、OCR 或 DOM 中得到算式，交给人工接管。

开始时先说明：`我会用 arithmetic-captcha-browser-automation 解析可读取的算术验证码文本，提交答案后以后续页面状态作为成功信号。`

## When to Use

使用这个 Skill 当：

- 页面提示 100 以内加减法验证码。
- 算式能从页面文本、OCR 结果、DOM 或接口响应中读取。
- 用户有权限访问该网站。
- 主流程需要在登录或提交前完成普通算术验证。

不要使用这个 Skill 当：

- 验证码是扭曲文字、图片选字、短信、邮箱 OTP、扫码或外部审批。
- 页面只给图片且没有 OCR 文本。
- 用户要求绕过未授权访问或平台风控。

## Input Contract

```json
{
  "challenge_type": "arithmetic",
  "captcha_text": "12 + 8 = ?",
  "answer_selector": "#captcha",
  "submit_selector": "确认",
  "max_retry": 2
}
```

## Output Contract

```json
{
  "success": true,
  "challenge_type": "arithmetic",
  "answer": "20",
  "retry_count": 0,
  "screenshot_path": "runs/<run-id>/screenshots/after_challenge.png"
}
```

## Workflow

1. 从页面文本、OCR 结果或接口响应读取算式。
2. 使用 [scripts/solve-arithmetic.js](/Users/dysania/program/skills/arithmetic-captcha-browser-automation/scripts/solve-arithmetic.js) 解析答案。
3. 填入答案输入框。
4. 点击验证按钮或继续登录/提交。
5. 以后续页面状态、验证响应或错误提示确认成功。
6. 失败超过 `max_retry` 后交给 `web-skill-manual-takeover`。

## Safety

- 不保存验证码原图中的私人信息。
- 不把验证码答案写入长期模板。
- 不对非授权网站做高频尝试。
- 无法稳定读取算式时停止并人工接管。
