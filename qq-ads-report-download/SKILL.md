---
name: qq-ads-report-download
description: Use when 需要在用户本机的真实 Google Chrome 中打开腾讯广告报表链接、把登录交接给用户，并在不使用 Codex Chrome 插件、内置浏览器或 Computer Use 的前提下，用本机脚本继续执行报表下载流程。
---

# 腾讯广告报表下载

用用户本机的真实 `Google Chrome` 执行腾讯广告报表下载流程，不用 Codex Chrome 插件，不用 `Computer Use`，不把下载动作放在内置浏览器里完成。

开始时先说明：`我会用 qq-ads-report-download 在本机 Google Chrome 打开腾讯广告链接，登录环节交给你，登录后我继续完成报表下载。`

## 输入要求

优先收集以下信息：

- 腾讯广告报表链接，例如 `https://ad.qq.com/lite/83259046/report`
- 日期区间，例如 `2026-05-11 - 2026-05-17`
- 报表路径是否固定为 `报表 -> 商品分析 -> 商品库`

如果缺少日期区间，只问一个简短问题补齐日期。

## 约束

始终遵守这些约束：

- 使用真实 `Google Chrome` 桌面应用
- 不使用 Codex Chrome 插件、Chrome Extension、claim tab 或任何依赖该插件的自动化方式
- 不使用 `Computer Use` 或任何 Codex 提供的桌面点击/读屏插件
- 不把最终下载留在 Codex 内置浏览器中执行
- 不尝试代替用户完成微信扫码、QQ 授权、短信验证码或二次确认

如果系统级 Chrome 不可用，明确告知用户并停止，不要偷偷切回 Codex 内置浏览器。

## 平台支持

- `macOS`：使用 [scripts/open_in_chrome.sh](/Users/dysania/program/skills/qq-ads-report-download/scripts/open_in_chrome.sh)
- `Windows`：使用 [scripts/open_in_chrome.ps1](/Users/dysania/program/skills/qq-ads-report-download/scripts/open_in_chrome.ps1)
- `Linux`：仅在本机已安装 `google-chrome`、`chromium` 或 `chromium-browser` 时，使用 `open_in_chrome.sh`
- 需要自动化时：
  - `macOS` / `Linux`：使用 [scripts/launch_debug_chrome.sh](/Users/dysania/program/skills/qq-ads-report-download/scripts/launch_debug_chrome.sh)
  - `Windows`：使用 [scripts/launch_debug_chrome.ps1](/Users/dysania/program/skills/qq-ads-report-download/scripts/launch_debug_chrome.ps1)
  - 脚本接管：使用 [scripts/report_session.mjs](/Users/dysania/program/skills/qq-ads-report-download/scripts/report_session.mjs)

不要把 `.sh` 说成 Windows 通用脚本，也不要把 `Google Chrome.app` 当成 Windows 路径。

## 自动化边界

这个技能只允许两类动作：

1. 手动交接层。
   - 打开真实 Chrome
   - 把登录链接交给用户
   - 等待用户在该 Chrome 会话里完成登录
   - 输出精确的手动点击路径

2. 脚本自动化层。
   - 用本机脚本启动带远程调试端口的真实 Chrome
   - 用 Playwright 通过 Chrome DevTools Protocol 接管该浏览器
   - 通过页内 DOM / 可访问角色继续执行页面动作

不要使用 Codex 的浏览器或桌面插件代替上面两层。

## 工作流

1. 选择执行模式。
   - 只需要把登录交给用户：用 `open_in_chrome.*`
   - 需要继续自动化页面：用 `launch_debug_chrome.*` 启动真实 Chrome，并保留该窗口给后续脚本接管

2. 识别是否需要登录。
   使用 [scripts/report_session.mjs](/Users/dysania/program/skills/qq-ads-report-download/scripts/report_session.mjs) 读取当前真实 Chrome 会话。
   如果 Chrome 页面出现腾讯广告登录、微信登录、QQ 登录、扫码、授权或 SSO 中转页：
   - 把当前登录链接明确发给用户
   - 告诉用户“请在刚打开的 Chrome 窗口里完成登录，完成后回复我已登录”
   - 等待用户回复，不要继续猜测登录已完成
   如果脚本检测到已经在报表后台，明确说明：
   - `流程本身仍然需要登录`
   - `这次之所以没有登录交接，是因为当前被脚本接管的 Chrome 会话已经有有效登录态`
   - `如果重复使用同一个 --profile-dir，这个登录态可能会跨运行保留`

3. 登录完成后继续报表路径。
   目标路径固定为：
   - 顶部 `报表`
   - 左侧 `商品分析`
   - 子项 `商品库`
   后续页面动作必须通过本机脚本继续，不要改用 Codex 插件点击。

4. 设置日期区间。
   把日期切换为用户要求的区间。默认按页面的日期范围控件设置开始日和结束日。
   如果当前页面已经在 `商品库` 且日期正确，直接进入下一步，不要重复刷新。

5. 触发下载。
   在“数据报表”区域点击 `下载`。
   只有在当前宿主已经通过本机脚本接管了真实 Chrome 时，才继续自动点选、保存和确认文件位置。
   如果没有这类能力，就停在正确页面，并明确告诉用户：
   `页面已定位并已设置好筛选条件，请你在真实 Chrome 中点击下载。`

## 交接话术

遇到登录时，直接使用这类话术：

`我已经在 Google Chrome 打开腾讯广告链接。请你在这个 Chrome 窗口里完成登录；如果当前是微信或 QQ 授权页，请完成扫码/授权。完成后回复我“已登录”，我继续执行报表下载。`

## 失败处理

遇到这些情况时，按下面方式处理：

- Chrome 没启动或没安装：告知用户需要本机 `Google Chrome`
- 登录状态丢失：重新用脚本打开原始报表链接，再次交给用户登录
- 当前普通 Chrome 已登录、但调试 Chrome 未登录：不要假设二者共享登录态，必须以被脚本接管的那个 Chrome 会话为准
- 页面路径变化：先确认是否仍在腾讯广告报表后台，再按最接近的“商品分析/商品库”路径查找
- 下载被当前自动化能力限制：停在正确页面，告诉用户手动点 `下载`
- 当前宿主没有脚本自动化条件：不要报错退出，改为输出手动步骤或仅完成打开浏览器与登录交接

## 快速命令

```bash
bash /Users/dysania/program/skills/qq-ads-report-download/scripts/open_in_chrome.sh "https://ad.qq.com/lite/83259046/report"
```

只想先把链接给用户看、不真正拉起 Chrome 时：

```bash
bash /Users/dysania/program/skills/qq-ads-report-download/scripts/open_in_chrome.sh --dry-run "https://ad.qq.com/lite/83259046/report"
```

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\path\to\qq-ads-report-download\scripts\open_in_chrome.ps1" "https://ad.qq.com/lite/83259046/report"
```

自动化模式启动真实 Chrome：

```bash
bash /Users/dysania/program/skills/qq-ads-report-download/scripts/launch_debug_chrome.sh "https://ad.qq.com/lite/83259046/report"
```

读取当前调试 Chrome 会话状态：

```bash
node /Users/dysania/program/skills/qq-ads-report-download/scripts/report_session.mjs \
  --endpoint http://127.0.0.1:9222 \
  --report-url "https://ad.qq.com/lite/83259046/report"
```

如果当前环境没有本地 `playwright` 包，先安装它，或者通过环境变量显式指定模块路径：

```bash
PLAYWRIGHT_MODULE_PATH=/absolute/path/to/node_modules/playwright/index.mjs \
node /Users/dysania/program/skills/qq-ads-report-download/scripts/report_session.mjs \
  --endpoint http://127.0.0.1:9222 \
  --report-url "https://ad.qq.com/lite/83259046/report"
```
