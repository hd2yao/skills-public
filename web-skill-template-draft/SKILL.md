---
name: web-skill-template-draft
description: 适用于网页自动化流程已经跑通或部分跑通后，需要根据运行记录、步骤日志、截图和结果文件生成可审查的流程 Skill 草稿或模板草稿。
---

# Web Skill Template Draft

这是 Web Skill Automation Hub 的模板草稿整理 Skill。它根据一次运行的输入、计划、步骤日志、截图和结果，整理 `flow.yaml`、草稿说明和可复用模板片段。需要创建站点级或流程级子 Skill 时，优先交给 `web-skill-flow-builder`。

开始时先说明：`我会用 web-skill-template-draft 从运行记录中提取稳定步骤和参数，生成不含凭据或私人数据的流程 Skill 草稿。`

## When to Use

使用这个 Skill 当：

- 一个网页自动化流程已经成功执行
- 用户要求把流程保存为模板或新 Skill 草稿
- 当前运行记录包含计划、步骤日志、截图和结果
- 需要把一次性操作泛化为可复用参数
- 需要基于已有模板生成相似流程草稿
- 需要输出 `flow.yaml` 或模板说明，而不是完整流程子 Skill

不要使用这个 Skill 当：

- 运行失败且缺少足够证据定位稳定步骤
- 用户想立即执行页面操作，而不是沉淀模板
- 草稿会包含密码、Cookie、Token、一次性验证码、私人数据或敏感截图
- 用户要求生成绕过验证、规避风控或未授权访问的流程
- 用户明确要求创建站点级或流程级子 Skill；这种情况使用 `web-skill-flow-builder`

## Required Inputs

```json
{
  "run_id": "2026-06-11_001",
  "task_name": "读取今日订单",
  "run_dir": "runs/2026-06-11_001",
  "source_url": "https://example.com/admin",
  "used_skills": [
    "web-skill-generic-login",
    "slider-captcha-browser-automation",
    "web-skill-page-workflow"
  ],
  "result_files": ["runs/2026-06-11_001/result.json"],
  "screenshots": ["runs/2026-06-11_001/screenshots/003_result.png"],
  "target_slug": "read-today-orders"
}
```

必须先读取：

- `input.json` 或用户原始输入摘要
- `plan.md` 或执行计划
- `step_logs.jsonl`
- `result.json` 或错误报告
- 关键截图路径

## Sanitization Rules

生成草稿前必须移除或参数化：

- passwords
- cookies
- tokens
- session IDs
- OTP and captcha answers
- real phone numbers, ID numbers, addresses, private names
- one-time URLs with secrets
- raw screenshots that expose sensitive data

敏感值应替换为参数，例如：

```yaml
inputs:
  username: env:EXAMPLE_USERNAME
  password: env:EXAMPLE_PASSWORD
  start_date: date
  end_date: date
```

## Draft Structure

草稿建议创建在目标 Skill 目录内，发布前必须由用户确认：

```text
<target-slug>/
  SKILL.md
  <target-slug>.discovery.md
  <target-slug>.plan.v1.md
  reviews/
```

`SKILL.md` 草稿必须包含：

- Chinese frontmatter description
- when to use and when not to use
- required inputs
- child skills used
- step sequence
- challenge handling
- risk gates
- output contract
- failure handling
- validation checklist

不要把草稿直接标记为已验证，除非已经用新输入再次跑通。

## Flow Template Shape

当用户只需要 `flow.yaml` 草稿时，使用：

```yaml
name: read_today_orders
display_name: 读取今日订单
version: 0.1.0
domain: example.com
type: template
risk_level: low
requires_confirmation: false
inputs:
  start_date: date
  end_date: date
outputs:
  orders: array
skills:
  - web-skill-generic-login
  - slider-captcha-browser-automation
  - web-skill-page-workflow
steps:
  - action: click
    target: 订单管理
    success: 订单管理菜单出现
  - action: click
    target: 订单列表
    success: 订单列表表格出现
  - action: fill
    target: 开始时间
    value: "{{start_date}}"
  - action: fill
    target: 结束时间
    value: "{{end_date}}"
  - action: click
    target: 查询
  - action: extract_table
    target: 订单表格
    columns: ["订单号", "手机号", "金额"]
success_conditions:
  - result contains at least requested columns
  - final screenshot captured
```

## Review Gate

草稿生成后必须检查：

- slug 使用小写字母、数字和连字符
- 所有凭据和隐私数据已移除
- 步骤不依赖一次性 DOM 状态
- 提交类动作有确认 gate
- 验证处理引用已有验证 Skill，而不是复制解题逻辑
- 成功条件和失败处理明确
- 用户确认后再把草稿作为正式 Skill 使用

如果用户想把模板升级成可调用的流程子 Skill，交给 `web-skill-flow-builder` 生成独立 Skill 目录和 `SKILL.md`。

## Common Mistakes

### Copying the run record verbatim

运行记录是证据，不是模板。模板必须参数化并脱敏。

### Publishing a draft too early

草稿至少需要用户审查；关键流程最好用第二个输入再次跑通后再视为正式技能。

### Saving secrets in examples

示例只能使用占位符、环境变量引用或脱敏值。

### Overfitting selectors

优先保存用户意图、可见文本、表头和区域名称。CSS selector 只能作为辅助信息。
