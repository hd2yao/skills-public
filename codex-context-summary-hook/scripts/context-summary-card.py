#!/usr/bin/env python3
"""Create a compact Markdown context card for Codex PreCompact hooks."""

from __future__ import annotations

import datetime as dt
import json
import os
import re
import sys
import tempfile
from pathlib import Path
from typing import Any


DEFAULT_CARD_DIR = Path.home() / ".codex" / "context-cards"
MAX_EVENTS = 24
MAX_ITEM_CHARS = 320
MAX_SYSTEM_MESSAGE_CHARS = 3500

SECRET_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"sk-(?:proj-)?[A-Za-z0-9_-]{20,}"), "[REDACTED]"),
    (re.compile(r"gh[pousr]_[A-Za-z0-9_]{20,}"), "[REDACTED]"),
    (
        re.compile(
            r"(?i)\b((?:AWS_)?(?:SECRET_ACCESS_KEY|ACCESS_KEY_ID)|"
            r"(?:OPENAI|ANTHROPIC|GITHUB|GITLAB|NPM|HF|HUGGINGFACE)_API_KEY|"
            r"(?:API[_-]?KEY|TOKEN|SECRET|PASSWORD))\s*=\s*[^ \n\r\t`'\"\]]+"
        ),
        r"\1=[REDACTED]",
    ),
    (
        re.compile(
            r"(?i)\b(api[_-]?key|token|secret|password)\s*[:=]\s*[^ \n\r\t`'\"\]]{8,}"
        ),
        r"\1=[REDACTED]",
    ),
)

BOILERPLATE_PREFIXES = (
    "# agents.md instructions for ",
    "<permissions instructions>",
    "<app-context>",
    "<environment_context>",
    "<collaboration_mode>",
    "<apps_instructions>",
    "<skills_instructions>",
    "<plugins_instructions>",
    "knowledge cutoff:",
    "you are an ai assistant accessed via an api",
    "you are codex, a coding agent",
)


def now_local() -> str:
    return dt.datetime.now().astimezone().isoformat(timespec="seconds")


def slugify(value: str, fallback: str = "codex") -> str:
    value = re.sub(r"[^A-Za-z0-9._-]+", "-", value.strip()).strip("-._")
    return value[:64] or fallback


def redact(text: str) -> str:
    redacted = text
    for pattern, replacement in SECRET_PATTERNS:
        redacted = pattern.sub(replacement, redacted)
    return redacted


def clean_text(value: str, limit: int = MAX_ITEM_CHARS) -> str:
    value = redact(value)
    value = re.sub(r"\x1b\[[0-9;]*[A-Za-z]", "", value)
    value = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", value)
    value = re.sub(r"\s+", " ", value).strip()
    if len(value) > limit:
        return value[: limit - 1].rstrip() + "..."
    return value


def is_boilerplate(text: str) -> bool:
    lowered = text.lstrip().lower()
    return any(lowered.startswith(prefix) for prefix in BOILERPLATE_PREFIXES)


def text_from_content(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(part for item in content if (part := text_from_content(item)))
    if isinstance(content, dict):
        for key in ("text", "message", "content", "input", "output"):
            if key in content:
                text = text_from_content(content[key])
                if text:
                    return text
    return ""


def message_from_record(record: dict[str, Any]) -> dict[str, str] | None:
    payload = record.get("payload") if isinstance(record.get("payload"), dict) else {}
    payload_type = payload.get("type")
    top_type = record.get("type")

    if payload_type == "user_message":
        role = "用户"
        text = text_from_content(payload.get("message")) or text_from_content(
            payload.get("text_elements")
        )
    elif payload_type == "agent_message":
        role = "助手"
        text = text_from_content(payload.get("message"))
    elif top_type == "response_item" and payload_type == "message":
        role = "用户" if payload.get("role") == "user" else "助手"
        text = text_from_content(payload.get("content"))
    else:
        return None

    text = clean_text(text)
    if not text:
        return None
    if is_boilerplate(text):
        return None

    phase = payload.get("phase") or ""
    timestamp = record.get("timestamp") or ""
    return {"role": role, "phase": str(phase), "text": text, "timestamp": str(timestamp)}


def parse_transcript(transcript_path: Path) -> tuple[dict[str, str], list[dict[str, str]]]:
    metadata: dict[str, str] = {}
    events: list[dict[str, str]] = []
    seen: set[tuple[str, str, str]] = set()

    if not transcript_path.exists():
        return {"transcript_error": f"transcript not found: {transcript_path}"}, []

    with transcript_path.open("r", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue

            payload = record.get("payload") if isinstance(record.get("payload"), dict) else {}
            if record.get("type") == "turn_context":
                for key in ("cwd", "model", "current_date", "timezone"):
                    if payload.get(key):
                        metadata[key] = clean_text(str(payload[key]), 800)
                summary = payload.get("summary")
                if summary and str(summary).lower() not in ("none", "auto"):
                    metadata["existing_summary"] = clean_text(str(summary), 1200)

            event = message_from_record(record)
            if event is None:
                continue

            dedupe_key = (event["role"], event["phase"], event["text"])
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            events.append(event)

    return metadata, events


def recent_by_role(events: list[dict[str, str]], role: str, limit: int = 5) -> list[dict[str, str]]:
    return [event for event in events if event["role"] == role][-limit:]


def infer_topic(events: list[dict[str, str]], cwd: str) -> str:
    users = recent_by_role(events, "用户", 1)
    if users:
        topic = users[0]["text"]
        topic = re.split(r"[。.!?\n]", topic, maxsplit=1)[0]
        return clean_text(topic, 120) or "PreCompact 上下文摘要"
    project = Path(cwd).name if cwd else "Codex"
    return f"{project} 会话压缩前摘要"


def bullet_lines(events: list[dict[str, str]]) -> list[str]:
    if not events:
        return ["- 暂无可提取消息。"]
    return [f"- `{event['timestamp'] or 'unknown'}` **{event['role']}**: {event['text']}" for event in events]


def build_card(
    hook_input: dict[str, Any],
    metadata: dict[str, str],
    events: list[dict[str, str]],
    card_path: Path,
) -> str:
    cwd = clean_text(str(hook_input.get("cwd") or metadata.get("cwd") or ""), 1000)
    trigger = clean_text(str(hook_input.get("trigger") or "unknown"), 120)
    session_id = clean_text(str(hook_input.get("session_id") or "unknown"), 200)
    transcript_path = clean_text(str(hook_input.get("transcript_path") or ""), 1000)
    model = metadata.get("model", "unknown")
    topic = infer_topic(events, cwd)
    users = recent_by_role(events, "用户")
    assistants = recent_by_role(events, "助手")
    timeline = events[-MAX_EVENTS:]

    lines = [
        "# Codex 上下文摘要卡片",
        "",
        f"- 生成时间: {now_local()}",
        f"- 触发事件: PreCompact ({trigger})",
        f"- 会话 ID: `{session_id}`",
        f"- 项目路径: `{cwd or 'unknown'}`",
        f"- 模型: `{model}`",
        f"- Transcript: `{transcript_path or 'unknown'}`",
        f"- 卡片路径: `{card_path}`",
        "",
        "## 当前主题",
        "",
        f"- {topic}",
        "",
        "## 最近用户请求",
        "",
        *bullet_lines(users),
        "",
        "## 最近助手进展",
        "",
        *bullet_lines(assistants),
        "",
        "## 压缩前时间线",
        "",
        *bullet_lines(timeline),
    ]

    if metadata.get("existing_summary"):
        lines.extend(["", "## 已有上下文摘要", "", metadata["existing_summary"]])

    if metadata.get("transcript_error"):
        lines.extend(["", "## 读取提示", "", f"- {metadata['transcript_error']}"])

    lines.extend(
        [
            "",
            "## 后续查看提示",
            "",
            "- 这张卡片由 PreCompact Hook 自动生成，用于压缩后快速回看当前上下文。",
            "- 若要定位完整细节，请打开上方 Transcript 或继续查看同目录下的摘要卡片。",
            "",
        ]
    )
    return "\n".join(lines)


def output_dir() -> Path:
    configured = os.environ.get("CODEX_CONTEXT_CARD_DIR")
    if configured:
        return Path(configured).expanduser()
    return DEFAULT_CARD_DIR


def write_card(card_dir: Path, hook_input: dict[str, Any], card: str) -> Path:
    cwd = str(hook_input.get("cwd") or "")
    project = slugify(Path(cwd).name if cwd else "codex")
    session = slugify(str(hook_input.get("session_id") or "session"))[:18]
    stamp = dt.datetime.now().astimezone().strftime("%Y%m%d-%H%M%S")
    filename = f"{stamp}-{project}-{session}.md"

    try:
        card_dir.mkdir(parents=True, exist_ok=True)
    except OSError:
        card_dir = Path(tempfile.gettempdir()) / "codex-context-cards"
        card_dir.mkdir(parents=True, exist_ok=True)

    card_path = card_dir / filename
    card_path.write_text(card, encoding="utf-8")
    return card_path


def build_system_message(card_path: Path, card: str) -> str:
    preview = "\n".join(card.splitlines()[:30])
    message = f"摘要卡片已生成: {card_path}\n\n{preview}"
    if len(message) > MAX_SYSTEM_MESSAGE_CHARS:
        message = message[: MAX_SYSTEM_MESSAGE_CHARS - 1].rstrip() + "..."
    return message


def success_payload(card_path: Path, system_message: str) -> dict[str, Any]:
    return {
        "continue": True,
        "suppressOutput": False,
        "systemMessage": system_message,
        "summary_card_path": str(card_path),
    }


def error_payload(message: str) -> dict[str, Any]:
    return {
        "continue": True,
        "suppressOutput": False,
        "systemMessage": f"摘要卡片生成失败: {clean_text(message, 600)}",
    }


def main() -> int:
    try:
        raw_input = sys.stdin.read().strip()
        hook_input = json.loads(raw_input) if raw_input else {}
        transcript = Path(str(hook_input.get("transcript_path") or "")).expanduser()
        metadata, events = parse_transcript(transcript)
        card_dir = output_dir()
        placeholder_path = card_dir / "pending.md"
        card = build_card(hook_input, metadata, events, placeholder_path)
        card_path = write_card(card_dir, hook_input, card)
        if str(placeholder_path) in card:
            card = card.replace(str(placeholder_path), str(card_path))
            card_path.write_text(card, encoding="utf-8")
        system_message = build_system_message(card_path, card)
        print(json.dumps(success_payload(card_path, system_message), ensure_ascii=False))
        return 0
    except Exception as exc:  # Keep compaction from being blocked by the hook.
        print(json.dumps(error_payload(str(exc)), ensure_ascii=False))
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
