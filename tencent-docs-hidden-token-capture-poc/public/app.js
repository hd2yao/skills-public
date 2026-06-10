const startButton = document.querySelector("#start-button");
const statusPanel = document.querySelector("#status-panel");

let currentSessionId = null;
let pollTimer = null;

function renderStatus(value) {
  statusPanel.textContent = value;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return payload;
}

async function refreshSession() {
  if (!currentSessionId) {
    return;
  }
  const session = await fetchJson(`/api/sessions/${currentSessionId}`);
  renderStatus(JSON.stringify(session, null, 2));
  if (session.status === "captured" || session.status === "failed") {
    clearInterval(pollTimer);
    pollTimer = null;
    startButton.disabled = false;
  }
}

startButton.addEventListener("click", async () => {
  startButton.disabled = true;
  renderStatus("正在启动登录会话...");

  try {
    const session = await fetchJson("/api/sessions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });

    currentSessionId = session.id;
    await refreshSession();
    pollTimer = setInterval(() => {
      refreshSession().catch((error) => {
        renderStatus(error.message);
      });
    }, 2000);
  } catch (error) {
    renderStatus(error.message);
    startButton.disabled = false;
  }
});
