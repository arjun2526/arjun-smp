
// ======================================
// ARJUN SMP — PHASE 2 LOGIN FIX
// ======================================

const SUPABASE_URL = "https://eefjxhcmxtawiiamzuoe.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8jlj8RfSCDY0F29QCdmNvQ_KKfBtxTE";
const ADMIN_EMAIL = "arjunkokanepcold@gmail.com";

const client = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

const loginScreen = document.getElementById("loginScreen");
const dashboardScreen = document.getElementById("dashboardScreen");

function showError(message) {
  loginMessage.textContent = "ERROR: " + message;
  loginMessage.style.color = "#e9b77f";
}

function showDashboard(username) {
  loginScreen.classList.add("hidden");
  dashboardScreen.classList.remove("hidden");
  document.getElementById("adminName").textContent = username;
}

async function checkAdmin(user, enteredUsername) {
  const { data, error } = await client
    .from("arjun_smp_admins")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Admin database: " + error.message);
  }

  if (!data) {
    throw new Error("Your account is not registered as an ARJUN SMP admin.");
  }

  if (data.username.toLowerCase() !== enteredUsername.toLowerCase()) {
    throw new Error("Incorrect admin username.");
  }

  return data.username;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!SUPABASE_URL.startsWith("https://") ||
      SUPABASE_URL.includes("YOUR_") ||
      SUPABASE_ANON_KEY.includes("YOUR_") ||
      !ADMIN_EMAIL.includes("@") ||
      ADMIN_EMAIL.includes("YOUR_")) {
    showError("Supabase configuration is incomplete. Check app.js.");
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "CONNECTING...";
  loginMessage.textContent = "Connecting to Supabase...";

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: password
    });

    if (error) throw new Error("Authentication: " + error.message);

    const adminUsername = await checkAdmin(data.user, username);

    showDashboard(adminUsername);

  } catch (error) {
    showError(error.message || "Unknown login error.");
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "▶ LOGIN TO PANEL";
  }
});

document.getElementById("logoutButton").addEventListener("click", async () => {
  const { error } = await client.auth.signOut();

  if (error) {
    showError(error.message);
    return;
  }

  dashboardScreen.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  document.getElementById("password").value = "";
  loginMessage.textContent = "Logged out successfully.";
});
