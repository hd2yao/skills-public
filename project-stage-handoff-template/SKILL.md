---
name: project-stage-handoff-template
description: 适用于项目完成一个阶段、准备切到下一阶段、交接给新线程/新代理/人工继续，或用户要求把当前进度、证据、风险和后续任务整理成阶段交接文档。
---

# Project Stage Handoff Template

用于生成项目阶段交接文档。它不是项目审计本身；如果当前状态还没查清，先使用 `project-status-auditor` 收集证据，再套用本模板。

开始时先说明：`我会用 project-stage-handoff-template 把当前阶段状态整理成交接文档，明确已完成证据、未完成事项、风险和下一步验收标准。`

## Template Asset

使用模板：

```text
project-stage-handoff-template/assets/project-stage-handoff.md
```

如果用户要求写文件，默认放在当前项目的：

```text
docs/handoffs/YYYY-MM-DD-<stage-slug>.md
```

没有 `docs/` 结构时，先询问或按当前项目约定选择位置；不要把交接文档散落在仓库根目录。

## Required Evidence

填写前至少确认：

- 当前分支和 git 状态。
- 本阶段目标或来源计划。
- 已完成内容及证据文件。
- 最近一次验证命令和结果。
- 未完成任务、阻塞点、风险。
- 下一阶段入口任务和验收标准。

不能确认的内容写“待确认”，不要编造。

## Output Rules

- 用中文。
- 保留证据路径或命令，不只写主观判断。
- 区分“已完成”“已验证”“已提交/已推送/已合并”。
- 如果有未提交 tracked 改动，必须在交接中写清楚。
- 不写凭据、私密链接、token、Cookie、`.env` 值。

## Common Mistakes

- 只写总结，不写证据。
- 把本地通过说成线上已合并。
- 忽略下一步的验收标准。
- 不区分阻塞点和普通待办。
