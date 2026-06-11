---
name: web-skill-submit-guard
description: 适用于网页自动化即将执行提交、发布、删除、接受任务、支付、下单、转账、批量修改等高风险页面动作，需要先展示内容、截图并取得用户明确确认的场景。
---

# Web Skill Submit Guard

这是 Web Skill Automation Hub 的提交保护子 Skill。它把高风险动作从普通页面操作中隔离出来，确保最终点击前有截图、内容摘要、风险说明和用户明确确认。

开始时先说明：`我会用 web-skill-submit-guard 在最终提交前展示目标动作、提交内容和提交前截图；只有你明确确认后才会执行一次。`

## When to Use

使用这个 Skill 当流程即将执行：

- 提交表单
- 发布内容
- 删除数据
- 接受任务
- 支付、下单、转账
- 批量修改、批量导入、批量导出到外部系统
- 修改后台配置、状态、价格、库存、权限或账号信息

不要使用这个 Skill 当：

- 用户只是搜索、筛选、读取、导出本地结果
- 当前页面状态还没有准备好提交
- 用户没有明确允许本任务包含提交类动作
- 用户要求自动跳过确认

## Required Preconditions

调用前必须满足：

- 主编排任务中 `allow_submit: true`
- 页面已经停在提交前状态
- 提交内容已经填写完成
- 已保存提交前截图
- 已提取可展示的提交摘要
- 当前没有登录、验证码、扫码或外部审批阻塞

缺少任一条件时停止，不要点击最终按钮。

## Confirmation Payload

提交前展示给用户：

```json
{
  "action": "click",
  "target": "提交",
  "page_url": "https://example.com/task/123",
  "risk_level": "high",
  "summary": {
    "task_title": "示例任务",
    "submit_content": "将提交给后台的正文或摘要",
    "changed_fields": ["提交内容"]
  },
  "before_screenshot": "runs/2026-06-11_001/screenshots/before_submit.png",
  "confirmation_required": true
}
```

如果摘要中包含手机号、身份证、Token、Cookie、密码或其他敏感字段，先脱敏再展示。

## Confirmation Rule

只有用户明确表达同意后才执行，例如：

- `确认提交`
- `可以提交`
- `同意执行这个提交`

以下表达不能视为确认：

- `继续`
- `下一步`
- `看起来可以`
- `你决定`
- 沉默或没有回复

如果确认语义不明确，只问一个简短问题：`请明确回复“确认提交”，我再执行最终提交。`

## Execution Rules

1. Capture before state.
   保存提交前截图、当前 URL、目标按钮或动作、提交摘要。

2. Ask for explicit confirmation.
   展示确认 payload，不隐藏关键字段。敏感字段脱敏。

3. Execute exactly once.
   用户确认后只执行一个最终动作。不要连点，不要在失败后自动重试。

4. Wait for result.
   等待导航、toast、接口响应、页面提示或状态变化。

5. Capture after state.
   保存提交后截图和结果文本。

6. Return outcome.
   输出成功、失败或未知，并包含证据路径和下一步建议。

## Output Contract

成功：

```json
{
  "success": true,
  "submitted": true,
  "action": "click",
  "target": "提交",
  "before_screenshot": "runs/2026-06-11_001/screenshots/before_submit.png",
  "after_screenshot": "runs/2026-06-11_001/screenshots/after_submit.png",
  "result_message": "提交成功"
}
```

未确认：

```json
{
  "success": false,
  "submitted": false,
  "failure_reason": "confirmation_missing",
  "before_screenshot": "runs/2026-06-11_001/screenshots/before_submit.png"
}
```

失败：

```json
{
  "success": false,
  "submitted": "unknown",
  "failure_reason": "submit_result_unclear",
  "before_screenshot": "runs/2026-06-11_001/screenshots/before_submit.png",
  "after_screenshot": "runs/2026-06-11_001/screenshots/after_submit.png",
  "result_message": "页面未返回明确结果"
}
```

## No Repeat Rule

提交后如果失败或结果不明确：

- 不要自动再次点击提交
- 保存当前页面证据
- 读取页面错误提示
- 返回给主编排和用户确认
- 只有用户再次明确确认，才允许第二次尝试

## Common Mistakes

### Treating allow_submit as final confirmation

`allow_submit: true` 只表示任务允许包含提交类动作，不等于用户已经确认当前页面的最终提交。

### Hiding changed content

用户必须看到即将提交的关键内容。敏感字段要脱敏，但不能完全省略风险摘要。

### Retrying automatically

提交动作可能产生副作用。失败或未知状态下禁止自动重复提交。

### Clicking submit before screenshot

必须先保存提交前截图，再请求确认，再执行最终动作。
