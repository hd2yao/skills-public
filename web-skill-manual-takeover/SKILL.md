---
name: web-skill-manual-takeover
description: 适用于网页自动化被短信、邮箱 OTP、扫码、设备审批、外部授权、未知验证码或连续失败阻塞，需要暂停执行并让用户人工完成当前步骤的场景。
---

# Web Skill Manual Takeover

这是 Web Skill Automation Hub 的人工接管子技能。它不尝试自动绕过验证，只负责把当前阻塞状态、接管说明、截图和恢复条件结构化交给用户。

开始时先说明：`我会用 web-skill-manual-takeover 暂停自动流程，记录当前阻塞原因和恢复条件；你人工完成后我再继续后续步骤。`

## When to Use

使用这个 Skill 当：

- 出现短信 OTP、邮箱 OTP、扫码、设备审批或第三方授权。
- 验证类型未知。
- 自动验证码技能达到重试上限。
- 页面元素反复找不到，需要用户手动点击一次。
- 提交类动作需要用户在真实页面中确认。

不要使用这个 Skill 当：

- 已有自动子技能可以安全处理当前验证。
- 用户要求跳过确认或绕过平台限制。
- 当前任务不需要浏览器状态接续。

## Input Contract

```json
{
  "run_id": "2026-06-11_001",
  "source_step": "challenge-route",
  "reason": "sms_otp",
  "current_url": "https://example.com/login",
  "screenshot_path": "runs/<run-id>/screenshots/challenge.png",
  "resume_condition": "用户完成短信验证码并页面进入后台首页"
}
```

## Output Contract

```json
{
  "success": false,
  "manual_takeover_required": true,
  "reason": "sms_otp",
  "resume_condition": "用户完成短信验证码并页面进入后台首页",
  "status": "waiting_for_user"
}
```

## Workflow

1. 保存当前 URL、截图、页面文本和来源步骤。
2. 生成人工接管说明。
3. 暂停自动执行。
4. 用户完成验证、审批或手动点击后，重新截图并检查恢复条件。
5. 恢复条件满足后把控制权交回主编排器。
6. 恢复条件不满足时记录错误报告并停止。

## Common Mistakes

### Treating takeover as success

人工接管状态不是任务成功，只是流程暂停。必须等恢复条件满足后才能继续。

### Logging private codes

不要把短信码、邮箱码、扫码内容或审批口令写进日志。
