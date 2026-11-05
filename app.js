const SUPABASE_URL = "https://eefjxhcmxtawiiamzuoe.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8jlj8RfSCDY0F29QCdmNvQ_KKfBtxTE";
const ADMIN_EMAIL = "arjunkokanepcold@gmail.com";

const client = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
const $ = id => document.getElementById(id);

const loginScreen = $("loginScreen");
const dashboard = $("dashboardScreen");
const loginMessage = $("loginMessage");

function showLogin(message = "") {
  loginScreen.classList.remove("hidden");
  dashboard.classList.add("hidden");
  loginMessage.textContent = message;
}

async function verifyAdmin(user, enteredUsername) {
  const { data, error } = await client
    .from("arjun_smp_admins")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error("Admin database: " + error.message);
  if (!data) throw new Error("This account is not an SMP admin.");
  if (data.username.toLowerCase() !== enteredUsername.toLowerCase()) {
    throw new Error("Incorrect username.");
  }

  return data.username;
}

async function loadStatus() {
  const { data, error } = await client
    .from("server_status")
    .select("*")
    .eq("server_id", "arjun-smp")
    .maybeSingle();

  if (error || !data) {
    $("serverStatus").textContent = "NO STATUS DATA";
    $("agentStatus").textContent = "UNKNOWN";
    return;
  }

  const online = data.status === "online";

  $("serverStatus").textContent = online ? "SERVER ONLINE" : "SERVER " + data.status.toUpperCase();
  $("statusDot").style.background = online ? "#91b887" : "#e9b77f";
  $("playersOnline").textContent = data.players_online;
  $("playerLimit").textContent = data.max_players;
  $("agentStatus").textContent = online ? "ONLINE" : "OFFLINE";
}

async function loadQueue() {
  const { data, error } = await client
    .from("server_commands")
    .select("id, command, status, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const list = $("queueList");
  list.replaceChildren();

  if (error) {
    list.textContent = "Could not load command queue: " + error.message;
    return;
  }

  if (!data || data.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No commands have been submitted yet.";
    list.appendChild(empty);
    return;
  }

  data.forEach(item => {
    const row = document.createElement("div");
    row.className = "queue-row";

    const name = document.createElement("span");
    name.className = "queue-name";
    name.textContent = "#" + item.id + " / " + item.command.toUpperCase();

    const status = document.createElement("span");
    status.className = "queue-status" + (item.status === "failed" ? " failed" : "");
    status.textContent = item.status.toUpperCase();

    row.append(name, status);
    list.appendChild(row);
  });
}

async function sendCommand(command) {
  const allowed = ["start", "stop", "restart", "save-all"];

  if (!allowed.includes(command)) return;

  if (!confirm("Add " + command.toUpperCase() + " to the server command queue?")) {
    return;
  }

  const buttons = document.querySelectorAll("[data-command]");
  buttons.forEach(button => button.disabled = true);

  try {
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) throw new Error("Your login session has expired.");

    const { error } = await client
      .from("server_commands")
      .insert({
        command,
        requested_by: user.id
      });

    if (error) throw error;

    alert("Command queued successfully. It has NOT executed yet.");
    await loadQueue();

  } catch (error) {
    alert("Command error: " + error.message);
  } finally {
    buttons.forEach(button => button.disabled = false);
  }
}

$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();

  const username = $("username").value.trim();
  const password = $("password").value;

  $("loginButton").disabled = true;
  $("loginButton").textContent = "CONNECTING...";
  loginMessage.textContent = "Checking credentials...";

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password
    });

    if (error) throw error;

    const verifiedName = await verifyAdmin(data.user, username);

    $("adminName").textContent = verifiedName;
    loginScreen.classList.add("hidden");
    dashboard.classList.remove("hidden");

    await Promise.all([loadStatus(), loadQueue()]);

  } catch (error) {
    showLogin(error.message);
  } finally {
    $("loginButton").disabled = false;
    $("loginButton").textContent = "▶ LOGIN";
  }
});

document.querySelectorAll("[data-command]").forEach(button => {
  button.addEventListener("click", () => sendCommand(button.dataset.command));
});

$("refreshButton").addEventListener("click", async () => {
  await Promise.all([loadStatus(), loadQueue()]);
});

$("logoutButton").addEventListener("click", async () => {
  const { error } = await client.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  $("password").value = "";
  showLogin("Logged out successfully.");
});

async function restoreSession() {
  try {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;

    if (!data.session) {
      showLogin();
      return;
    }

    const usernameInput = prompt("Enter your admin username to verify this session:");

    if (!usernameInput) {
      await client.auth.signOut();
      showLogin();
      return;
    }

    const name = await verifyAdmin(data.session.user, usernameInput);
    $("adminName").textContent = name;
    loginScreen.classList.add("hidden");
    dashboard.classList.remove("hidden");

    await Promise.all([loadStatus(), loadQueue()]);

  } catch (error) {
    await client.auth.signOut();
    showLogin(error.message);
  }
}

if (
  SUPABASE_URL.includes("YOUR_") ||
  SUPABASE_ANON_KEY.includes("YOUR_") ||
  ADMIN_EMAIL.includes("YOUR_")
) {
  showLogin("Complete your Supabase configuration in app.js.");
} else {
  restoreSession();
}
