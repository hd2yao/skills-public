---
name: web-skill-automation-hub
description: 适用于用户提供目标网站、账号或登录态、页面操作说明，希望通过多个浏览器自动化 Skill 串联完成登录、验证、操作、读取、提交确认、截图记录和流程沉淀的任务。
---

# Web Skill Automation Hub

这是网页自动化任务的主编排 Skill。它不直接替代子 Skill 执行细节，而是负责把用户目标拆成计划、选择合适子 Skill、控制风险边界、保存运行证据，并在成功后沉淀流程草稿。

开始时先说明：`我会用 web-skill-automation-hub 解析任务、生成执行计划，并按登录、验证、页面操作、提取、提交确认和模板沉淀的顺序调度可用技能。`

## When to Use

使用这个 Skill 当用户要求：

- 打开某个网站并完成登录后的页面操作
- 根据自然语言、文档或截图执行后台流程
- 读取表格、列表、搜索结果或页面字段
- 处理登录或提交过程中的滑块拼图验证
- 在提交、发布、删除、接受任务等高风险操作前做确认
- 将跑通的网页流程保存为可复用 Skill 或流程模板草稿

不要使用这个 Skill 当：

- 用户要求绕过无授权访问、批量高频采集、风控规避或真实用户校验
- 任务只需要回答概念问题，不需要实际编排浏览器流程
- 当前已有更具体的站点级 Skill 可以完整覆盖任务

## Required Inputs

先收集最小必要信息，不一次性追问所有字段：

| Field | Required | Notes |
|---|---:|---|
| `url` | yes | 目标页面或登录页 |
| `task_description` | yes | 用户要完成的页面目标 |
| `credential` | if login needed | 用户输入、环境变量或已有登录态 |
| `login_state` | optional | 已保存 profile 或 storage state |
| `challenge_hint` | optional | 例如 `slider_puzzle` |
| `allow_submit` | yes for submit tasks | 未明确允许时，提交类动作只到确认前 |
| `reference_skill` | optional | 可参考的历史 Skill 或模板 |

账号、密码、Cookie、Token 不能写入 Skill、日志、截图说明或提交内容。需要凭据时，请让用户通过环境变量或一次性输入提供。

## Task Classification

把任务先归到一个或多个类型：

| Type | Use when |
|---|---|
| `login_only` | 只验证能否登录 |
| `read_data` | 读取表格、详情或文本 |
| `search_and_extract` | 搜索后提取结果 |
| `click_operation` | 点击、筛选、翻页、导航 |
| `form_fill` | 填写表单但不最终提交 |
| `submit_task` | 接受任务、提交表单、发布、删除、支付或批量操作 |
| `generate_skill` | 从成功流程生成新 Skill 草稿 |
| `replay_template` | 参考已有模板执行相似流程 |

如果任务包含提交类动作，即使还包含读取或填写，也必须标记为 `submit_task` 并启用确认 gate。

## Orchestration Flow

按这个顺序执行：

1. Normalize task.
   记录 URL、目标、登录方式、风险选项、输出格式和参考 Skill。

2. Generate plan.
   输出步骤列表，每步包括目的、候选子 Skill、成功信号、截图点、失败处理。

3. Open browser and establish state.
   先判断是否已有登录态。没有登录态时调用登录类子 Skill；缺少登录子 Skill 时生成明确手动登录交接步骤。

4. Detect challenge.
   登录或关键操作失败时，检查页面、网络请求、弹窗、错误提示和 DOM。

5. Route challenge.
   第一版自动验证基线通过 `web-skill-challenge-router` 选择处理路径，并只把滑块拼图交给 `slider-captcha-browser-automation`：
   - 如果是滑块或拼图验证码，路由到 `slider-captcha-browser-automation` 检查 create / verify 请求并完成拖动验证。
   - 如果不是滑块拼图，或图片/后端验证证据不可用，进入人工接管。
   - 不要把短信、邮箱 OTP、扫码、设备审批或外部授权交给自动验证 Skill。

6. Execute page workflow.
   按计划调用页面操作或提取子 Skill。每个关键页面转换后截图，元素找不到时保存 DOM 或页面文本。

7. Gate risky actions.
   对提交、发布、删除、接受任务、批量操作、支付、下单、转账等动作，必须先展示将执行的动作、目标页面、提交内容和提交前截图。用户确认前停止。

8. Save result.
   保存最终 JSON、CSV、Markdown 摘要或错误报告。成功时记录可复用步骤。

9. Draft template or skill.
   用户要求沉淀时，把运行记录交给 `web-skill-flow-builder` 或模板草稿子 Skill，不要直接把一次性凭据、Cookie 或敏感截图写进模板。

## Executable Prototype

当前目录包含 V0.1 可执行原型：

```bash
node web-skill-automation-hub/scripts/run-orchestrator.js \
  --task path/to/task.json \
  --runs-dir web-skill-automation-hub/runs
```

这个命令会执行 dry-run 编排：

- 读取 JSON 或 YAML 任务文件。
- 标准化任务并识别任务类型。
- 读取 `skill.yaml` registry。
- 生成执行计划。
- 写入 `input.json`、`task.json`、`plan.yaml`、`step_logs.jsonl`、`result.json` 和 `report.md`。

dry-run 不启动浏览器，也不点击真实页面；真实执行必须接入浏览器 adapter，并继续遵守提交保护 gate。

成功运行后可以从运行目录生成流程模板：

```bash
node web-skill-automation-hub/scripts/generate-template.js \
  --run-dir web-skill-automation-hub/runs/<run-id> \
  --templates-dir web-skill-automation-hub/templates
```

浏览器执行层通过 `adapters/` 中的统一接口接入。当前提供：

- `playwright-adapter.js`：适合新流程和已有 Playwright 验证技能。
- `puppeteer-adapter.js`：兼容 PRD 第一版建议和已有 JS/Puppeteer 技能。

adapter 负责 `open/click/fill/screenshot/getText/getDomSnapshot/waitForLoad/saveLoginState/loadLoginState`，主编排器不直接绑定具体浏览器库。

## Local Service

V1.0 本地服务原型：

```bash
node web-skill-automation-hub/server/local-server.js --port 8787
```

服务提供：

- `GET /api/skills`：返回 skill registry。
- `POST /api/tasks/dry-run`：创建 dry-run 任务并写入运行记录。
- `GET /api/runs`：列出运行记录。
- `GET /api/runs/<run-id>`：读取单次运行详情。
- `POST /api/templates`：从运行记录生成流程模板。
- `GET /`：打开轻量任务创建和运行记录页面。

## Skill Layering

主编排不应该为每个新 URL 重新创建一整套登录、点击、提交、提取技能。第一版采用两层：

- 通用能力层：登录、验证路由、滑块验证、页面操作、提交保护、模板草稿。这些技能复用在所有网站上。
- 流程子技能层：针对某个网站或稳定业务流程生成一个流程 Skill 草稿，例如“51job 结束待跟进制作并返回”或“某后台读取今日订单”。

处理新网站时，先用通用能力层执行和观察；只有用户要求复用、或流程已跑通并值得沉淀时，才调用 `web-skill-flow-builder` 生成一个具体流程子 Skill 草稿。

## Child Skill Selection

优先选择当前仓库已有的具体 Skill。选择顺序：

| Capability | Preferred skill |
|---|---|
| challenge classification | `web-skill-challenge-router` if available |
| slider puzzle challenge | `slider-captcha-browser-automation` |
| arithmetic challenge | `arithmetic-captcha-browser-automation` |
| manual takeover | `web-skill-manual-takeover` |
| site-specific flow | 用户指定的 `reference_skill` |
| generic login | `web-skill-generic-login` if available |
| page operation and extraction | `web-skill-page-workflow` if available |
| structured data extraction | `web-skill-data-extractor` if available |
| submit confirmation | `web-skill-submit-guard` if available |
| process child skill creation | `web-skill-flow-builder` if available |
| template draft | `web-skill-template-draft` if available |

如果一个子 Skill 不存在，主编排 Skill 应输出待执行步骤和所需输入，不要编造文件路径、API 或 handler。

## Run Evidence

每次运行建议使用这种结构：

```text
runs/<run-id>/
  input.json
  task.json
  plan.md
  step_logs.jsonl
  result.json
  report.md
  screenshots/
  dom/
  error/
```

每一步日志至少包含：

- step id and title
- selected skill
- start and end time
- screenshot path if captured
- success signal
- error message if failed
- retry or manual takeover decision

敏感字段必须脱敏，例如密码只记录为 `<redacted>`。

## Failure Handling

- 登录失败：截图、保存当前 URL、判断是否出现验证、检查是否账号密码错误，再决定重试或人工接管。
- 滑块验证失败：最多按用户给定次数重试；仍失败时保留网络证据并人工接管。
- 元素找不到：截图、保存 DOM、尝试可见文本匹配；仍失败则停止并给修复建议。
- 提交失败：保存提交前后截图和页面提示；不要重复提交，除非用户再次明确确认。
- 子 Skill 缺失：生成可执行的手动或待实现计划，不要假装已经执行。

## Output Contract

完成后返回：

```json
{
  "success": true,
  "run_id": "2026-06-11_001",
  "task_type": ["read_data"],
  "used_skills": ["slider-captcha-browser-automation"],
  "result_files": ["runs/2026-06-11_001/result.json"],
  "screenshots": ["runs/2026-06-11_001/screenshots/001_open_url.png"],
  "template_generated": false,
  "next_action": null
}
```

失败时返回错误报告、最后截图、已完成步骤、下一步建议和是否需要用户接管。

## Common Mistakes

### Starting browser work before planning

先生成计划，再执行。没有计划就无法判断该截图、该确认还是该调用子 Skill。

### Treating all captcha failures as slider failures

只有滑块或拼图验证码才交给 `slider-captcha-browser-automation`。OTP、扫码和外部审批必须人工接管。

### Skipping submit confirmation

高风险动作默认停止在确认前。用户没有明确允许提交时，不能点击最终提交按钮。

### Logging secrets

不要把账号密码、Cookie、Token、验证码原文或环境变量值写进 Skill、日志或结果文件。

### Generating templates from accidental state

模板只能保存稳定步骤、选择器意图、输入参数和成功条件。不要保存一次性登录态或当前页面的私人数据。

### Creating a full skill stack for every new URL

新网站通常先走通用技能执行；需要长期复用时，只生成一个站点级或流程级子 Skill 草稿。不要为每个 URL 重建通用登录、页面操作、提交保护等技能。
