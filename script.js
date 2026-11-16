const rankedLevels = [
  'Firework',
  'Unknown',
  'Kenos',
  'Zodiac',
  'BloodLust',
  'Shardscapes',
  'Arctic Lights',
  'Wasureta',
  'Sonic Wave',
  'Golden Club',
  'Yatagarasu',
  'Athanatos',
  'Bloodbath',
  'Cataclysm',
  'Sweater Weather',
  'Acu',
  'Crazy III',
  'Rauchkammer',
  'Supersonic',
  'Deathnote',
  'Crazy II',
  'MikuMikuMikuMiku',
  'Future Funk',
  'Crazy',
  'Nine Circles',
  'Troll Madness',
  'B',
  'Theory Of SkriLLex',
  'Ultraviolence',
  'Retro Circles',
  'Blast Processed',
  'Demon Park',
  'Permafrost Mountain',
  'The Nightmare'
];

const totalPlacements = 50;
const list = document.getElementById("ranking-list");
const podium = document.getElementById("podium");
const search = document.getElementById("search");
const resultCount = document.getElementById("result-count");
const emptyState = document.getElementById("empty-state");
const toast = document.getElementById("toast");

document.getElementById("ranked-count").textContent = rankedLevels.length;

function renderPodium() {
  podium.innerHTML = rankedLevels.slice(0, 3).map((name, index) => `
    <article class="podium-card ${index === 0 ? "first" : ""}">
      <span class="podium-rank">#${String(index + 1).padStart(2, "0")} · ${index === 0 ? "HARDEST" : index === 1 ? "2ND PLACE" : "3RD PLACE"}</span>
      <h3>${escapeHTML(name)}</h3>
    </article>
  `).join("");
}

function renderList(query = "") {
  const normalized = query.trim().toLowerCase();
  const rows = Array.from({ length: totalPlacements }, (_, index) => {
    const rank = index + 1;
    const name = rankedLevels[index] || "";
    return { rank, name, reserved: !name };
  }).filter(item => !normalized || (item.name || "reserved placement").toLowerCase().includes(normalized) || String(item.rank).includes(normalized));

  list.innerHTML = rows.map(item => {
    const rankClass = item.rank === 1 ? "top-one" : item.rank === 2 ? "top-two" : item.rank === 3 ? "top-three" : "";
    return `<li class="rank-row ${rankClass} ${item.reserved ? "reserved" : ""}">
      <span class="rank-number">#${String(item.rank).padStart(2, "0")}</span>
      <span class="rank-name">${item.reserved ? "Open placement" : escapeHTML(item.name)}</span>
      <span class="rank-tag">${item.reserved ? "RESERVED" : "RANKED"}</span>
    </li>`;
  }).join("");

  resultCount.textContent = normalized
    ? `${rows.filter(row => !row.reserved).length} matching ranked levels · ${rows.length} results`
    : `${rankedLevels.length} ranked levels · ${totalPlacements - rankedLevels.length} open`;
  emptyState.hidden = rows.length !== 0;
  list.hidden = rows.length === 0;
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2100);
}

search.addEventListener("input", event => renderList(event.target.value));
document.getElementById("copy-all").addEventListener("click", async () => {
  const text = rankedLevels.map((name, index) => `${index + 1}. ${name}`).join("\\n");
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

renderPodium();
renderList();
