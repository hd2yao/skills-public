---
name: reference-project-research-template
description: 适用于用户需要把参考项目、开源仓库、竞品或 API 文档调研结果整理成统一文档，并要求包含项目清单、可借鉴点、当前项目映射、差距和落地任务。
---

# Reference Project Research Template

用于生成参考项目调研文档。它提供文档结构；如果还没有完成调研和当前项目对照，先使用 `reference-project-study-roadmap`。

开始时先说明：`我会用 reference-project-research-template 按统一结构整理参考项目调研、当前项目映射和落地任务。`

## Template Asset

使用模板：

```text
reference-project-research-template/assets/reference-project-research.md
```

如果用户要求拆成多份文档，优先使用：

```text
docs/research/open-source-study.md
docs/research/current-mvp-gap-analysis.md
docs/research/adoption-roadmap.md
```

如果用户要求单文件汇总，使用模板资产完整输出。

## Required Evidence

填写前至少确认：

- 参考项目来源：URL、本地路径或文档链接。
- 每个参考项目的可信证据：README、代码、配置、示例、测试、release 或文档。
- 当前项目的模块、文档、配置、测试或输出证据。
- 许可证或复用限制；不确定时写“待确认”。
- 落地任务的验收证据。

## Output Rules

- 用中文。
- 不把参考项目代码直接复制到当前项目建议中。
- 区分“可借鉴设计”和“可直接复用代码”。
- 当前状态只能写：已实现、部分实现、概念相似、未实现、不适用、待确认。
- 每个落地任务都要有优先级、依赖和验收证据。

## Common Mistakes

- 只写项目简介，没有映射到当前项目。
- 只列功能，不说明实现证据。
- 没有标注许可证、数据源和登录/权限风险。
- 路线图任务缺少验收条件。
