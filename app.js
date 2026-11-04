(() => {
  const pages = ["overview","console","players","properties","plugins","worlds","settings","activity"];
  const crumb = document.getElementById("crumb");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("mobileOverlay");
  const toast = document.getElementById("toast");
  let toastTimer;

  function notify(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  function openPage(name) {
    if (!pages.includes(name)) return;
    pages.forEach(page => {
      document.getElementById(`page-${page}`).classList.toggle("active", page === name);
    });
    document.querySelectorAll("[data-page]").forEach(button => {
      button.classList.toggle("active", button.dataset.page === name);
    });
    crumb.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    window.scrollTo({top:0, behavior:"smooth"});
  }

  document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      openPage(button.dataset.page);
    });
  });
  document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => openPage(button.dataset.go));
  });

  document.getElementById("mobileMenu").addEventListener("click", () => {
    sidebar.classList.add("open");
    overlay.classList.add("show");
  });
  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  });

  document.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      const messages = {
        start: "Server start will be enabled after the secure phone agent is connected (Phase 3).",
        stop: "Server stop will be enabled after the secure phone agent is connected (Phase 3).",
        restart: "Server restart will be enabled after the secure phone agent is connected (Phase 3).",
        connect: "This action will be connected to your phone agent in a later phase."
      };
      notify(messages[action] || "This feature is planned for a later phase.");
    });
  });

  document.getElementById("refreshButton").addEventListener("click", () => {
    notify("Preview refreshed. Live server data is not connected yet.");
  });
  document.getElementById("helpButton").addEventListener("click", () => {
    notify("ARJUN SMP Phase 1: frontend preview. Authentication and server agent are next.");
  });
  document.getElementById("dismissNotice").addEventListener("click", () => {
    document.querySelector(".page.active .notice")?.remove();
  });

  const propertyIds = ["motd","maxPlayers","viewDistance","simulationDistance","gamemode","difficulty","whitelist","pvp"];
  const defaults = {
    motd:"ARJUN SMP", maxPlayers:"5", viewDistance:"4", simulationDistance:"3",
    gamemode:"survival", difficulty:"normal", whitelist:"true", pvp:"true"
  };
  function loadProperties() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem("arjunSmpPreviewProperties") || "{}"); } catch (_) {}
    propertyIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = saved[id] ?? defaults[id];
    });
  }
  document.getElementById("saveProperties").addEventListener("click", () => {
    const values = {};
    propertyIds.forEach(id => {
      const el = document.getElementById(id);
      values[id] = el.value;
    });
    const max = Number(values.maxPlayers);
    if (!Number.isInteger(max) || max < 1 || max > 20) {
      notify("For this phone-hosted preview, choose a player limit from 1 to 20.");
      return;
    }
    localStorage.setItem("arjunSmpPreviewProperties", JSON.stringify(values));
    notify("Saved in this browser only. Your phone's server.properties is unchanged.");
  });
  loadProperties();

  document.getElementById("commandForm").addEventListener("submit", event => {
    event.preventDefault();
    const input = document.getElementById("commandInput");
    if (input.value.trim()) {
      notify("Console is preview-only. No command was sent to your Minecraft server.");
      input.value = "";
    }
  });
  document.getElementById("clearConsole").addEventListener("click", () => {
    document.getElementById("terminal").innerHTML =
      '<div class="terminal-line muted">Console view cleared. Agent is not connected.</div>';
  });
})();