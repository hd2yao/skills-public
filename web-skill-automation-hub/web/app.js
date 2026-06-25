"use strict";

const $ = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "content-type": "application/json",
    },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || response.statusText);
  }
  return payload;
}

function taskPayload() {
  return {
    task_name: $("taskName").value.trim() || "web-skill-task",
    url: $("taskUrl").value.trim(),
    credential: null,
    operation: {
      description: $("taskDescription").value.trim(),
    },
    risk: {
      allow_submit: $("allowSubmit").checked,
      require_confirmation: true,
    },
    output: {
      format: ["json"],
    },
    template: {
      save_if_success: $("saveTemplate").checked,
      template_name: $("taskName").value.trim() || null,
    },
  };
}

function renderJson(target, value) {
  target.textContent = JSON.stringify(value, null, 2);
}

async function refreshSkills() {
  const data = await api("/api/skills");
  $("skillsList").innerHTML = data.skills.map((skill) => `
    <div class="item">
      <strong>${escapeHtml(skill.name)}</strong>
      <span class="meta">${escapeHtml(skill.type)} · ${escapeHtml(skill.version)} · risk ${escapeHtml(skill.risk_level)}</span>
    </div>
  `).join("");
}

async function refreshRuns() {
  const data = await api("/api/runs");
  $("runsList").innerHTML = data.runs.map((run) => `
    <div class="item">
      <strong>${escapeHtml(run.run_id)}</strong>
      <span class="meta">${escapeHtml(run.task_name || "unknown")} · ${escapeHtml((run.task_type || []).join(", "))}</span>
    </div>
  `).join("") || '<span class="meta">暂无运行记录</span>';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

$("dryRun").addEventListener("click", async () => {
  $("resultOutput").textContent = "正在生成计划...";
  try {
    const result = await api("/api/tasks/dry-run", {
      method: "POST",
      body: JSON.stringify(taskPayload()),
    });
    renderJson($("resultOutput"), result);
    await refreshRuns();
  } catch (error) {
    renderJson($("resultOutput"), { error: error.message });
  }
});

$("refreshSkills").addEventListener("click", refreshSkills);
$("refreshRuns").addEventListener("click", refreshRuns);

refreshSkills().catch((error) => renderJson($("resultOutput"), { error: error.message }));
refreshRuns().catch(() => {});
