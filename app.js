// =====================================
// ARJUN SMP — PHASE 2 AUTHENTICATION
// =====================================

// 1. Paste your Supabase project URL.
const SUPABASE_URL = "PASTE_YOUR_SUPABASE_PROJECT_URL";

// 2. Paste your Supabase anon / publishable key.
// NEVER paste your service_role key here.
const SUPABASE_ANON_KEY = "PASTE_YOUR_SUPABASE_ANON_KEY";

// 3. The email of the admin account you create in Supabase Auth.
const ADMIN_EMAIL = "YOUR_ADMIN_EMAIL";

// =====================================

const client = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const loginScreen = document.getElementById("loginScreen");
const dashboardScreen = document.getElementById("dashboardScreen");
const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");
const adminName = document.getElementById("adminName");

function showLogin(message = "") {
  loginScreen.classList.remove("hidden");
  dashboardScreen.classList.add("hidden");
  loginMessage.textContent = message;
}

function showDashboard(username) {
  loginScreen.classList.add("hidden");
  dashboardScreen.classList.remove("hidden");
  adminName.textContent = username;
}

function configurationIsValid() {
  return (
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("PASTE_") &&
    SUPABASE_ANON_KEY.length > 20 &&
    !SUPABASE_ANON_KEY.includes("PASTE_") &&
    ADMIN_EMAIL.includes("@") &&
    !ADMIN_EMAIL.includes("YOUR_")
  );
}

// Check that the signed-in account is in the admin allowlist.
async function verifyAdmin(user) {
  const { data, error } = await client
    .from("arjun_smp_admins")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    await client.auth.signOut();
    throw new Error("This account is not authorized as an admin.");
  }

  return data.username;
}

// Login form.
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!configurationIsValid()) {
    showLogin("Set your Supabase URL, anon key and admin email in app.js first.");
    return;
  }

  const enteredUsername = document
    .getElementById("username")
    .value.trim()
    .toLowerCase();

  const password = document.getElementById("password").value;

  if (!enteredUsername || !password) {
    showLogin("Enter your username and password.");
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "CHECKING...";
  loginMessage.textContent = "Connecting securely...";

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: password
    });

    if (error) throw error;

    const verifiedUsername = await verifyAdmin(data.user);

    if (verifiedUsername.toLowerCase() !== enteredUsername) {
      await client.auth.signOut();
      throw new Error("Incorrect admin username.");
    }

    showDashboard(verifiedUsername);
  } catch (error) {
    showLogin(error.message || "Login failed. Check your details.");
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "▶ LOGIN TO PANEL";
  }
});

// Restore an existing login after refreshing the page.
async function restoreSession() {
  if (!configurationIsValid()) {
    showLogin("Configure Supabase in app.js to activate login.");
    return;
  }

  try {
    const { data, error } = await client.auth.getSession();

    if (error) throw error;

    if (!data.session) {
      showLogin();
      return;
    }

    const username = await verifyAdmin(data.session.user);
    showDashboard(username);
  } catch (error) {
    showLogin(error.message || "Please sign in again.");
  }
}

// Logout.
document.getElementById("logoutButton").addEventListener("click", async () => {
  await client.auth.signOut();
  document.getElementById("password").value = "";
  showLogin("You have been logged out.");
});

restoreSession();
