---
name: web-skill-flow-builder
description: 适用于主编排流程已经拿到具体网站 URL、用户操作说明、截图或成功运行记录，需要生成一个站点级或流程级子 Skill 草稿来复用该具体网页流程的场景。
---

# Web Skill Flow Builder

这是 Web Skill Automation Hub 的流程子技能生成器。它负责把某个具体网站、具体页面流程或成功运行记录，沉淀成一个站点级或流程级子 Skill 草稿。

开始时先说明：`我会用 web-skill-flow-builder 把这个具体网页流程整理成一个可审查的流程子 Skill 草稿；通用登录、验证、页面操作和提交保护能力会继续复用已有通用技能。`

## Core Architecture

不要为每个新 URL 重建一整套通用子技能。

固定通用层：

- `web-skill-automation-hub`: 主编排
- `web-skill-generic-login`: 通用登录
- `web-skill-challenge-router`: 验证路由
- `slider-captcha-browser-automation`: 滑块拼图验证
- `web-skill-page-workflow`: 通用页面操作和提取
- `web-skill-submit-guard`: 提交保护
- `web-skill-template-draft`: 模板/草稿整理

按需生成的流程层：

- 只描述某个站点或某类流程的稳定步骤
- 调用上面的通用技能
- 保存该流程的输入参数、页面路径、选择规则、风险 gate 和成功信号
- 先作为草稿，用户确认并至少验证一次后再视为正式 Skill

## When to Use

使用这个 Skill 当：

- 用户给了一个新 URL 和具体流程说明
- 用户给了截图，希望以后复用同类操作
- 一个流程已经用通用技能跑通，需要生成流程子 Skill
- 一个新网站和已有流程类似，只是菜单、字段或页面路径不同
- 主编排需要把本次探索结果固化成站点级流程

不要使用这个 Skill 当：

- 只是执行一次临时操作，不需要复用
- 流程还没有足够证据说明稳定步骤
- 用户要求绕过授权、风控、验证码或平台限制
- 生成内容会包含密码、Cookie、Token、一次性验证码或私人数据

## Decision Rule

按这个顺序决策：

1. 新 URL 第一次出现：先用通用技能执行和观察，不立刻创建流程 Skill。
2. 用户明确要求“保存为技能”“以后复用”“生成流程”：调用本 Skill 生成草稿。
3. 流程成功跑通一次：可以生成草稿，但标记为 `draft`。
4. 草稿用第二次输入或用户确认验证后：才建议作为正式流程 Skill 使用。
5. 只有当流程足够稳定、复用价值明确时，才新增目录和 `SKILL.md`。

## Required Inputs

```json
{
  "target_url": "https://hub.51job.com/#/make",
  "workflow_name": "结束待跟进制作并返回",
  "user_goal": "选择当前可见表格第一条已开始制作，进入详情，打开结束制作弹窗后返回",
  "evidence": {
    "screenshots": ["runs/2026-06-11_001/screenshots/list.png"],
    "step_logs": "runs/2026-06-11_001/step_logs.jsonl",
    "result": "runs/2026-06-11_001/result.json"
  },
  "reuse_intent": true,
  "risk_level": "high"
}
```

如果没有成功运行记录，可以基于用户说明和截图生成探索型草稿，但必须标注 `needs_validation: true`。

## Generated Skill Shape

生成的流程子 Skill 应该放在独立目录：

```text
<site-or-flow-slug>/
  SKILL.md
  <site-or-flow-slug>.discovery.md
  <site-or-flow-slug>.plan.v1.md
  reviews/
```

`SKILL.md` 草稿必须包含：

- 中文 frontmatter description
- 适用网站和适用页面
- 触发条件和不适用条件
- 必要输入参数
- 复用的通用子技能列表
- 逐步流程
- 当前可见表格或页面元素选择规则
- 验证/登录/人工接管规则
- 提交保护 gate
- 成功信号和失败处理
- 草稿验证状态

## Generated Flow Pattern

流程子 Skill 应该这样引用通用能力，而不是复制通用逻辑：

```markdown
## Child Skills

- Use `web-skill-generic-login` if login state is missing.
- Use `web-skill-challenge-router` if a challenge appears.
- Use `web-skill-page-workflow` for low-risk page navigation and extraction.
- Use `web-skill-submit-guard` before any final submit-class action.

## Flow

1. Confirm the current visible table is `待跟进制作`.
2. Select the top visible row whose `任务状态` is `已开始`.
3. Record the row evidence: `制作编号`, task name, status.
4. Open the detail view.
5. Verify detail `制作编号` equals the selected row.
6. Click `结束制作` to open the reminder.
7. Click `我已知晓，关闭`.
8. When the end modal appears, click `返回`; do not click `确定` unless a separate submit confirmation explicitly asks for it.
```

## Safety Rules

- Do not include passwords, cookies, tokens, OTPs, session IDs, or raw private data.
- Do not convert a screenshot-only guess into a verified skill.
- Do not create a new generic subskill for every site.
- Do not click submit-class buttons in a generated flow unless it routes through `web-skill-submit-guard`.
- If user screenshot and automation DOM disagree, generated flow must say to trust the current visible screenshot/table and re-snapshot.

## Publication Gate

Before a generated flow becomes a formal reusable Skill:

- slug is stable and specific
- sensitive data is removed
- child skills are referenced, not copied
- at least one success path is documented
- failure and manual takeover paths are documented
- user has reviewed the workflow
- real-site validation status is recorded

## Common Mistakes

### Creating generic skills for every URL

The generic stack is stable. New URLs normally produce one process-specific flow skill, not a new login skill, click skill, submit skill, and extraction skill.

### Publishing after one screenshot

A screenshot can seed a draft, but it does not prove the workflow. Mark screenshot-derived drafts as needing validation.

### Baking in accidental row values

A generated flow should say “top visible row with status 已开始”, not hardcode one production number unless the user specifically wants that exact record.

### Copying solver or submit logic

Generated flow skills should call `slider-captcha-browser-automation` and `web-skill-submit-guard`; they should not reimplement them.
