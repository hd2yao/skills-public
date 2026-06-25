---
name: web-skill-data-extractor
description: 适用于网页自动化已经进入目标页面，需要从表格、列表、详情字段、搜索结果、链接或页面文本中提取结构化数据并输出 JSON、CSV 或 Markdown 的场景。
---

# Web Skill Data Extractor

这是 Web Skill Automation Hub 的数据提取子技能。它只负责把已经可见或已抓取的页面数据结构化，不负责登录、验证、页面导航或最终提交。

开始时先说明：`我会用 web-skill-data-extractor 从当前页面或已采集 DOM 中提取结构化数据，并按需要输出 JSON、CSV 或 Markdown。`

## When to Use

使用这个 Skill 当：

- 页面已经登录并停在目标数据区域。
- 需要提取表格、列表、搜索结果、详情字段、链接或图片链接。
- 需要把结果输出为 JSON、CSV 或 Markdown。
- 主流程需要把数据提取与页面点击解耦。

不要使用这个 Skill 当：

- 页面仍被登录、验证码或外部审批阻塞。
- 用户要求高频、大规模或绕过平台限制采集。
- 操作会修改后台数据或触发提交。

## Input Contract

```json
{
  "source_url": "https://example.com/orders",
  "data_type": "table",
  "columns": ["订单号", "手机号", "金额"],
  "rows": [
    ["A001", "13800008888", "99.00"]
  ],
  "output_format": ["json", "csv"]
}
```

## Output Contract

```json
{
  "success": true,
  "source_url": "https://example.com/orders",
  "data_type": "table",
  "rows": [
    {
      "订单号": "A001",
      "手机号": "138****8888",
      "金额": "99.00"
    }
  ],
  "files": ["runs/<run-id>/result.json", "runs/<run-id>/result.csv"]
}
```

## Workflow

1. 确认页面已停在目标数据区域。
2. 记录来源 URL、截图和数据范围。
3. 对表格按表头和行提取。
4. 对详情页按 `字段: 值` 或 label/value 结构提取。
5. 对手机号、身份证、Token 等敏感字段脱敏。
6. 输出 JSON/CSV/Markdown。
7. 把结果路径交回主编排器。

## Helper

使用 [scripts/extract-data.js](/Users/dysania/program/skills/web-skill-data-extractor/scripts/extract-data.js) 处理表格矩阵、CSV 和键值文本。
