---
name: web-skill-page-workflow
description: 适用于网页自动化已经完成登录和验证后，需要根据用户描述执行低风险页面导航、点击、输入、筛选、等待、翻页、读取表格或提取页面可见数据的流程。
---

# Web Skill Page Workflow

这是 Web Skill Automation Hub 的页面操作与数据提取子 Skill。它把自然语言页面目标转成可复盘步骤，执行低风险操作，并输出结构化结果。它不执行最终提交、发布、删除、支付、下单或批量修改。

开始时先说明：`我会用 web-skill-page-workflow 把页面目标拆成可验证步骤，执行低风险操作并保存截图和结构化结果；如遇提交类动作会停止并请求提交保护。`

## When to Use

使用这个 Skill 当：

- 登录和验证已经完成
- 用户要求点击菜单、输入筛选条件、搜索、翻页或切换标签
- 用户要求读取表格、列表、详情字段、链接或页面文本
- 需要把页面结果输出为 JSON、CSV 或 Markdown 摘要
- 需要从成功步骤中沉淀可复用流程

不要使用这个 Skill 当：

- 操作会最终提交、发布、删除、支付、下单、接受任务或批量修改
- 页面仍被登录、验证码、扫码或外部授权阻塞
- 用户要求高频采集、绕过平台限制或访问未授权数据

## Input Contract

```json
{
  "current_url": "https://example.com/admin",
  "task_description": "进入订单列表，筛选今天，读取订单号、手机号、金额",
  "steps": [],
  "output_format": ["json", "csv"],
  "risk": {
    "allow_submit": false
  }
}
```

如果 `steps` 为空，先根据 `task_description` 生成计划并展示给主编排流程。

## Step DSL

支持这些低风险动作：

```yaml
steps:
  - action: goto
    url: "https://example.com/admin/orders"
    success: "订单列表页面出现"
  - action: click
    target: "订单管理"
    success: "订单菜单展开"
  - action: fill
    target: "开始时间"
    value: "{{start_date}}"
    success: "输入框值等于 start_date"
  - action: wait
    type: "network_idle"
  - action: extract_table
    target: "订单表格"
    columns: ["订单号", "手机号", "金额"]
```

允许动作：

| Action | Purpose |
|---|---|
| `goto` | 打开目标页面 |
| `click` | 点击链接、菜单、按钮，但不点最终提交 |
| `fill` | 输入文本、日期、关键词 |
| `select` | 选择下拉框 |
| `check` | 勾选普通筛选项 |
| `scroll` | 滚动查找内容 |
| `wait` | 等待加载、网络空闲或元素出现 |
| `switch_tab` | 切换浏览器标签 |
| `enter_iframe` | 进入 iframe 上下文 |
| `paginate` | 翻页 |
| `extract_table` | 提取表格 |
| `extract_list` | 提取列表或搜索结果 |
| `extract_text` | 提取页面文本或字段 |

禁止动作：

- `submit`
- `delete`
- `publish`
- `pay`
- `order`
- `accept_task`
- `bulk_update`

遇到禁止动作时，停止并返回 `submit_guard_required: true`。

## Target Resolution

选择目标时按稳定性排序：

1. 可访问角色和名称，例如 button name
2. label 和 placeholder
3. 可见文本及其附近上下文
4. 表头、菜单层级、区域标题
5. 稳定属性，例如 `name`, `data-testid`, `aria-*`
6. CSS selector 作为最后选择

不要只根据坐标点击，除非用户正在人工接管并明确要求记录一次点击。

## Execution Rules

- 每个步骤执行前确认当前页面状态。
- 每个页面跳转、筛选、搜索、翻页和提取后截图。
- 每个步骤都要有成功信号；没有成功信号时至少检查 URL、可见文本、元素状态或网络空闲。
- 元素找不到时，保存截图和 DOM 摘要，再尝试文本近似匹配。
- 不要静默重试超过主编排给定次数。
- 如果页面出现新的登录或验证阻塞，停止并返回给主编排。

## Extraction Output

表格输出：

```json
{
  "source_url": "https://example.com/orders",
  "data_type": "table",
  "columns": ["订单号", "手机号", "金额"],
  "rows": [
    {
      "订单号": "A001",
      "手机号": "138****8888",
      "金额": "99.00"
    }
  ],
  "screenshot": "runs/2026-06-11_001/screenshots/orders_table.png"
}
```

列表输出：

```json
{
  "source_url": "https://example.com/search",
  "data_type": "list",
  "items": [
    {
      "title": "示例标题",
      "price": "99.00",
      "link": "https://example.com/item/1"
    }
  ]
}
```

## Submit Guard Handoff

如果用户步骤包含提交类动作，返回：

```json
{
  "success": false,
  "submit_guard_required": true,
  "blocked_action": {
    "action": "click",
    "target": "提交"
  },
  "prepared_state_screenshot": "runs/2026-06-11_001/screenshots/before_submit.png"
}
```

主编排 Skill 必须把这个状态交给 `web-skill-submit-guard` 或人工确认流程。

## Common Mistakes

### Clicking through vague instructions

先把用户描述拆成步骤和成功信号，再执行。不要一边猜一边点。

### Extracting data without source context

结果必须带 source URL、字段名、截图和输出格式，否则后续无法复盘。

### Treating search buttons as submit buttons

查询、筛选、搜索通常是低风险，但“提交、发布、删除、接受、支付、下单、批量修改”必须进入提交保护。

### Ignoring page load state

点击或筛选后要等待页面稳定。不要在数据还在刷新时提取结果。
