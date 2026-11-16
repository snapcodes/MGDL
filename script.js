alert("MGDL JavaScript is running!");
const rankedLevels = [
  'Firework','Unknown','Kenos','Zodiac','BloodLust','Shardscapes','Arctic Lights','Wasureta',
  'Sonic Wave','Golden Club','Yatagarasu','Athanatos','Bloodbath','Cataclysm','Sweater Weather',
  'Acu','Crazy III','Rauchkammer','Supersonic','Deathnote','Crazy II','MikuMikuMikuMiku',
  'Future Funk','Crazy','Nine Circles','Troll Madness','B','Theory Of SkriLLex','Ultraviolence',
  'Retro Circles','Blast Processed','Demon Park','Permafrost Mountain','The Nightmare'
];
const totalPlacements = 50;
const list = document.getElementById("ranking-list");
const podium = document.getElementById("podium");
const search = document.getElementById("search");
const resultCount = document.getElementById("result-count");
const emptyState = document.getElementById("empty-state");
const toast = document.getElementById("toast");

/* YouTube search destinations are used until exact showcase videos are verified. */
const youtubeSearch = name => "https://www.youtube.com/results?search_query=" + encodeURIComponent("Geometry Dash " + name + " level showcase");
const levelPoints = rank => Math.round(300 - ((rank - 1) * (290 / 33)));
document.getElementById("ranked-count").textContent = rankedLevels.length;

function renderPodium() {
  podium.innerHTML = rankedLevels.slice(0, 3).map((name, index) => `
    <article class="podium-card ${index === 0 ? "first" : ""}">
      <span class="podium-rank">#${String(index + 1).padStart(2, "0")} · ${index === 0 ? "HARDEST" : index === 1 ? "2ND PLACE" : "3RD PLACE"}</span>
      <h3>${escapeHTML(name)}</h3>
      <small class="podium-points">${levelPoints(index + 1)} MV POINTS</small>
    </article>`).join("");
}
function renderList(query = "") {
  const normalized = query.trim().toLowerCase();
  const rows = Array.from({ length: totalPlacements }, (_, index) => {
    const rank = index + 1, name = rankedLevels[index] || "";
    return { rank, name, reserved: !name };
  }).filter(item => !normalized || (item.name || "reserved placement").toLowerCase().includes(normalized) || String(item.rank).includes(normalized));
  list.innerHTML = rows.map(item => {
    const rankClass = item.rank === 1 ? "top-one" : item.rank === 2 ? "top-two" : item.rank === 3 ? "top-three" : "";
    const content = item.reserved
      ? `<span class="rank-name">Open placement</span>`
      : `<a class="level-link" href="${youtubeSearch(item.name)}" target="_blank" rel="noopener noreferrer" aria-label="Find ${escapeHTML(item.name)} showcase on YouTube"><span class="rank-name">${escapeHTML(item.name)}</span></a>`;
    return `<li class="rank-row ${rankClass} ${item.reserved ? "reserved" : ""}">
      <span class="rank-number">#${String(item.rank).padStart(2, "0")}</span>
      ${content}
      <span class="rank-tag">${item.reserved ? "RESERVED" : levelPoints(item.rank) + " MV"}</span>
    </li>`;
  }).join("");
  resultCount.textContent = normalized
    ? `${rows.filter(row => !row.reserved).length} matching ranked levels · ${rows.length} results`
    : `${rankedLevels.length} ranked levels · ${totalPlacements - rankedLevels.length} open`;
  emptyState.hidden = rows.length !== 0;
  list.hidden = rows.length === 0;
}
function escapeHTML(value) {
  return value.replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
let toastTimer;
function showToast(message) {
  toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
search.addEventListener("input", event => renderList(event.target.value));
document.getElementById("copy-all").addEventListener("click", async () => {
  const text = rankedLevels.map((name, index) => `${index + 1}. ${name}`).join("\n");
  try { await navigator.clipboard.writeText(text); showToast("Ranked levels copied!"); }
  catch { showToast("Copy unavailable in this browser context."); }
});
document.addEventListener("keydown", event => {
  if (event.key === "/" && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) { event.preventDefault(); search.focus(); }
  if (event.key === "Escape" && document.activeElement === search) { search.value=""; renderList(); search.blur(); }
});

/* Supabase authentication */
const SUPABASE_URL = "https://iqcaofidhbtvjenxjdxn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_LrQJOMTBs-7ogwr4sFcTNw_1Km0nbhp";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const authModal = document.getElementById("auth-modal");
const recordModal = document.getElementById("record-modal");
const authForm = document.getElementById("auth-form");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authTitle = document.getElementById("auth-title");
const authSubmit = authForm.querySelector('button[type="submit"]');
const authNote = authModal.querySelector(".modal-note");
const accountButton = document.getElementById("account-open");
let authMode = "signin";
let currentSession = null;

function openModal(modal){ modal.hidden=false; }
function closeModals(){ authModal.hidden=true; recordModal.hidden=true; }
function setAuthBusy(busy) {
  authSubmit.disabled = busy;
  document.getElementById("google-signin").disabled = busy;
  authSubmit.textContent = busy ? "PLEASE WAIT..." : (authMode === "signup" ? "Create account" : "Continue with email");
}
function setAuthMode(mode) {
  authMode = mode;
  document.querySelectorAll("[data-auth-mode]").forEach(tab => {
    const active = tab.dataset.authMode === mode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-pressed", String(active));
  });
  authTitle.textContent = mode === "signup" ? "CREATE ACCOUNT" : "SIGN IN";
  authPassword.autocomplete = mode === "signup" ? "new-password" : "current-password";
  authSubmit.textContent = mode === "signup" ? "Create account" : "Continue with email";
  authNote.textContent = mode === "signup"
    ? "A verification email will be sent before your new account can sign in."
    : "Use your verified email and password, or continue with Google.";
}
function updateAccountButton(session) {
  currentSession = session;
  accountButton.textContent = session ? "Sign out" : "Sign in";
  accountButton.title = session?.user?.email || (session ? "Signed in" : "Sign in");
}
accountButton.addEventListener("click", async () => {
  if (currentSession) {
    const { error } = await supabaseClient.auth.signOut();
    if (error) showToast(error.message);
    else showToast("Signed out.");
  } else {
    openModal(authModal);
  }
});
document.getElementById("submit-record-open").addEventListener("click", async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    showToast("Sign in first to submit a record.");
    openModal(authModal);
    return;
  }
  showToast("Record submission is not connected yet.");
});
document.querySelectorAll("[data-close-modal]").forEach(button=>button.addEventListener("click",closeModals));
[authModal,recordModal].forEach(modal=>modal.addEventListener("click",event=>{if(event.target===modal)closeModals();}));
document.querySelectorAll("[data-auth-mode]").forEach(button=>button.addEventListener("click",()=>setAuthMode(button.dataset.authMode)));

authForm.addEventListener("submit", async event => {
  event.preventDefault();
  const email = authEmail.value.trim();
  const password = authPassword.value;
  setAuthBusy(true);
  try {
    if (authMode === "signup") {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: "https://snapcodes.github.io/MGDL/" }
      });
      if (error) throw error;
      if (data.session) {
        showToast("Account created and signed in.");
        closeModals();
      } else {
        showToast("Check your email to verify your MGDL account.");
        authNote.textContent = "Verification email sent. Open it to confirm your account, then sign in.";
      }
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast("Welcome back to MGDL!");
      closeModals();
    }
  } catch (error) {
    showToast(error.message || "Authentication failed.");
  } finally {
    setAuthBusy(false);
  }
});
document.getElementById("google-signin").addEventListener("click", async () => {
  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://snapcodes.github.io/MGDL/" }
    });
    if (error) throw error;
  } catch (error) {
    showToast(error.message || "Google sign-in failed.");
  }
});
supabaseClient.auth.onAuthStateChange((_event, session) => updateAccountButton(session));
supabaseClient.auth.getSession().then(({ data, error }) => {
  if (error) showToast(error.message);
  updateAccountButton(data?.session || null);
});

/* Record submission remains inactive until its database schema and RLS policies are verified. */
document.getElementById("record-form").addEventListener("submit",event=>{
  event.preventDefault();
  showToast("Record submissions will activate after database security is configured.");
});
const levelSelect=document.getElementById("record-level");
levelSelect.innerHTML=rankedLevels.map(name=>`<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join("");

renderPodium();
renderList();
