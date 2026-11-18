
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

const levelVideos = {
  "Firework": "https://www.youtube.com/watch?v=QBe5x2o9v2w",
  "Unknown": "https://www.youtube.com/watch?v=WqnY045n88E",
  "Kenos": "https://www.youtube.com/watch?v=TfwUCuC6Z2I",
  "Zodiac": "https://www.youtube.com/watch?v=HCQK_y8JutU",
  "BloodLust": "https://www.youtube.com/watch?v=pZlRHWuVDn4",
  "Shardscapes": "https://www.youtube.com/watch?v=KB-71zV91Fo",
  "Arctic Lights": "https://www.youtube.com/watch?v=XIr19lJGK-o",
  "Wasureta": "https://www.youtube.com/watch?v=LDdnsp53PJs",
  "Sonic Wave": "https://www.youtube.com/watch?v=ovuzGG96P20",
  "Golden Club": "https://www.youtube.com/watch?v=P1fNbBg7THQ",
  "Yatagarasu": "https://www.youtube.com/watch?v=ENpcuAjvxcg",
  "Athanatos": "https://www.youtube.com/watch?v=Hfo5Bshtpqk",
  "Bloodbath": "https://www.youtube.com/watch?v=pilKVtZafYM",
  "Cataclysm": "https://www.youtube.com/watch?v=eOuENjRCKzY",
  "Sweater Weather": "https://www.youtube.com/watch?v=IncATy5L9fo",
  "Acu": "https://www.youtube.com/watch?v=OJySIle2syE",
  "Crazy III": "https://www.youtube.com/watch?v=u47noIkjCS8",
  "Rauchkammer": "https://www.youtube.com/watch?v=1FaArAxopqw",
  "Supersonic": "https://www.youtube.com/watch?v=G-d7mw6Qcxs",
  "Deathnote": "https://www.youtube.com/watch?v=asQrt9B3aMo",
  "Crazy II": "https://www.youtube.com/watch?v=eGPNEaZV6cc",
  "MikuMikuMikuMiku": "https://www.youtube.com/watch?v=_Appi7XvIzg",
  "Future Funk": "https://www.youtube.com/watch?v=8gUo6NWiZGE",
  "Crazy": "https://www.youtube.com/watch?v=g_MP6BENHEs",
  "Nine Circles": "https://www.youtube.com/watch?v=gAlTQFXzdas",
  "Troll Madness": "https://www.youtube.com/watch?v=eBgxBEyXBy0",
  "B": "https://www.youtube.com/watch?v=sOsgFqcveX4",
  "Theory Of SkriLLex": "https://www.youtube.com/watch?v=A7xp50um2xQ",
  "Ultraviolence": "https://www.youtube.com/watch?v=tL2X3Fy0BUQ",
  "Retro Circles": "https://www.youtube.com/watch?v=6wxvgxVh8_Y",
  "Blast Processed": "https://www.youtube.com/watch?v=D9IkzRHmVNE",
  "Demon Park": "https://www.youtube.com/watch?v=Pp_Rxn5jltM",
  "Permafrost Mountain": "https://www.youtube.com/watch?v=wZBuNT6cRVQ",
  "The Nightmare": "https://www.youtube.com/watch?v=zf3z4mxgOBs"
};

const youtubeSearch = name => levelVideos[name] || null;

function safeVideoUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

const MGDL_levelPoints = new Map();

const levelPoints = rank => {
  const name = rankedLevels[rank - 1];

  return MGDL_levelPoints.has(name)
    ? MGDL_levelPoints.get(name)
    : Math.round(300 - ((rank - 1) * (290 / 33)));
};

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
    const rank = index + 1;
    const name = rankedLevels[index] || "";
    return { rank, name, reserved: !name };
  }).filter(item =>
    !normalized ||
    (item.name || "reserved placement").toLowerCase().includes(normalized) ||
    String(item.rank).includes(normalized)
  );

  list.innerHTML = rows.map(item => {
    const rankClass = item.rank === 1 ? "top-one" :
      item.rank === 2 ? "top-two" :
      item.rank === 3 ? "top-three" : "";

    const videoUrl = item.reserved ? null : safeVideoUrl(youtubeSearch(item.name));

    const content = item.reserved
      ? `<span class="rank-name">Open placement</span>`
      : videoUrl
        ? `<a class="level-link" href="${videoUrl}" target="_blank" rel="noopener noreferrer" aria-label="Watch ${escapeHTML(item.name)} video">
             <span class="rank-name">${escapeHTML(item.name)}</span>
           </a>`
        : `<span class="rank-name">${escapeHTML(item.name)}</span>`;

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
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

search.addEventListener("input", event => renderList(event.target.value));

document.getElementById("copy-all").addEventListener("click", async () => {
  const text = rankedLevels.map((name, index) => `${index + 1}. ${name}`).join("\n");

  try {
    await navigator.clipboard.writeText(text);
    showToast("Ranked levels copied!");
  } catch {
    showToast("Copy unavailable in this browser context.");
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    search.focus();
  }

  if (event.key === "Escape" && document.activeElement === search) {
    search.value = "";
    renderList();
    search.blur();
  }
});

/* Supabase authentication */

const SUPABASE_URL = "https://iqcaofidhbtvjenxjdxn.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_LrQJOMTBs-7ogwr4sFcTNw_1Km0nbhp";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

/* DATABASE RANKING INTEGRATION */

function MGDL_setRankedLevels(levels) {
  if (!Array.isArray(levels)) return;

  const sortedLevels = [...levels].sort(
    (a, b) => Number(a.rank) - Number(b.rank)
  );

  rankedLevels.splice(
    0,
    rankedLevels.length,
    ...sortedLevels.map(level => level.name)
  );

  MGDL_levelPoints.clear();

  sortedLevels.forEach(level => {
    MGDL_levelPoints.set(level.name, Number(level.mv_points));
    if (level.video_url) {
      const safeUrl = safeVideoUrl(level.video_url);
      if (safeUrl) levelVideos[level.name] = safeUrl;
    }
  });

  document.getElementById("ranked-count").textContent = rankedLevels.length;

  const levelSelect = document.getElementById("record-level");

  if (levelSelect) {
    levelSelect.innerHTML = rankedLevels.map(name =>
      `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`
    ).join("");
  }

  renderPodium();
  renderList(search.value);
}

window.MGDL_setRankedLevels = MGDL_setRankedLevels;

async function MGDL_reloadRankedLevels() {
  const { data, error } = await supabaseClient
    .from("ranked_levels")
    .select("rank, name, mv_points, video_url")
    .order("rank", { ascending: true });

  if (error) {
    console.error("MGDL ranked levels:", error.message);
    showToast("Could not load database rankings.");
    return;
  }

  if (!Array.isArray(data)) return;

  MGDL_setRankedLevels(data);
}

window.MGDL_reloadRankedLevels = MGDL_reloadRankedLevels;

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

function openModal(modal) {
  modal.hidden = false;
}

function closeModals() {
  authModal.hidden = true;
  recordModal.hidden = true;
}

function setAuthBusy(busy) {
  authSubmit.disabled = busy;
  document.getElementById("google-signin").disabled = busy;

  authSubmit.textContent = busy
    ? "PLEASE WAIT..."
    : (authMode === "signup" ? "Create account" : "Continue with email");
}

function setAuthMode(mode) {
  authMode = mode;

  document.querySelectorAll("[data-auth-mode]").forEach(tab => {
    const active = tab.dataset.authMode === mode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-pressed", String(active));
  });

  authTitle.textContent = mode === "signup" ? "CREATE ACCOUNT" : "SIGN IN";

  authPassword.autocomplete = mode === "signup"
    ? "new-password"
    : "current-password";

  authSubmit.textContent = mode === "signup"
    ? "Create account"
    : "Continue with email";

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

document.querySelectorAll("[data-close-modal]").forEach(button =>
  button.addEventListener("click", closeModals)
);

[authModal, recordModal].forEach(modal =>
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModals();
  })
);

document.querySelectorAll("[data-auth-mode]").forEach(button =>
  button.addEventListener("click", () => setAuthMode(button.dataset.authMode))
);

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
        options: {
          emailRedirectTo: "https://snapcodes.github.io/MGDL/"
        }
      });

      if (error) throw error;

      if (data.session) {
        showToast("Account created and signed in.");
        closeModals();
      } else {
        showToast("Check your email to verify your MGDL account.");
        authNote.textContent =
          "Verification email sent. Open it to confirm your account, then sign in.";
      }
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

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
      options: {
        redirectTo: "https://snapcodes.github.io/MGDL/"
      }
    });

    if (error) throw error;
  } catch (error) {
    showToast(error.message || "Google sign-in failed.");
  }
});

supabaseClient.auth.onAuthStateChange((_event, session) =>
  updateAccountButton(session)
);

supabaseClient.auth.getSession().then(({ data, error }) => {
  if (error) showToast(error.message);
  updateAccountButton(data?.session || null);
});

/* Existing record submission placeholder */

document.getElementById("record-form").addEventListener("submit", event => {
  event.preventDefault();
  showToast("Record submissions will activate after database security is configured.");
});

const levelSelect = document.getElementById("record-level");

levelSelect.innerHTML = rankedLevels.map(name =>
  `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`
).join("");

renderPodium();
renderList();

MGDL_reloadRankedLevels();

