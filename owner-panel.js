
/* =========================================
   MGDL OWNER CONTROL PANEL
   Only profiles.role = 'owner' can use it.
   ========================================= */

(() => {
  function startOwnerPanel() {
    if (typeof supabaseClient === "undefined") {
      console.error("MGDL Owner: Supabase client unavailable.");
      return;
    }

    const about = document.getElementById("about");
    if (!about) return;

    let currentUser = null;
    let selectedPlayer = null;
    let rankedLevelNames = [];

    const hammerSvg = `
      <svg class="mgdl-hammer-icon" viewBox="0 0 24 24"
           xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path d="M14.2 2.8 21.2 9.8 17.8 13.2 14.8 10.2 8.1 16.9
                 10.9 19.7 7.7 22.9 1.1 16.3 4.3 13.1 7.1 15.9
                 13.8 9.2 10.8 6.2 14.2 2.8Z"/>
      </svg>`;

    // ---------- OWNER BADGE ----------
    function updateOwnerBadge() {
      const viewer = document.querySelector(".mgdl-profile-viewer");
      if (!viewer) return;

      const username = viewer.querySelector(".mgdl-viewer-username");
      if (!username) return;

      const isOwner = username.textContent.trim().toLowerCase() === "snapped";
      let badge = viewer.querySelector(".mgdl-owner-badge");

      if (isOwner && !badge) {
        badge = document.createElement("span");
        badge.className = "mgdl-owner-badge";
        badge.innerHTML = hammerSvg;
        badge.title = "Owner";
        badge.setAttribute("aria-label", "Owner");
        username.insertAdjacentElement("afterend", badge);
      }

      if (badge) badge.hidden = !isOwner;
    }

    const viewerObserver = new MutationObserver(updateOwnerBadge);
    viewerObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    updateOwnerBadge();

    // ---------- PANEL ----------
    const panel = document.createElement("section");
    panel.className = "mgdl-owner-panel";
    panel.hidden = true;

    panel.innerHTML = `
      <div class="mgdl-owner-heading">
        <span class="mgdl-owner-hammer">${hammerSvg}</span>
        <div>
          <h2>OWNER CONTROL PANEL</h2>
          <p>MGDL administration</p>
        </div>
      </div>

      <div class="mgdl-owner-tabs">
        <button type="button" data-tab="levels" class="active">LEVELS</button>
        <button type="button" data-tab="players">PLAYERS</button>
      </div>

      <div class="mgdl-owner-content" data-content="levels">
        <h3>Ranked level management</h3>
        <form id="mgdl-owner-add-level">
          <label for="mgdl-new-level">Level name</label>
          <input id="mgdl-new-level" maxlength="80"
                 placeholder="New level name" required>

          <label for="mgdl-new-points">MV points</label>
          <input id="mgdl-new-points" type="number"
                 min="0" max="100000" value="10" required>

          <label for="mgdl-new-video">YouTube video URL (optional)</label>
          <input id="mgdl-new-video" type="url"
                 placeholder="https://www.youtube.com/watch?v=...">

          <button type="submit">ADD RANKED LEVEL</button>
        </form>
        <p class="mgdl-owner-status" id="mgdl-level-status"
           aria-live="polite"></p>

        <h3>Current ranked levels</h3>
        <div id="mgdl-owner-level-list">Loading levels...</div>
      </div>

      <div class="mgdl-owner-content" data-content="players" hidden>
        <h3>Player management</h3>
        <label for="mgdl-owner-player-search">Find a registered player</label>
        <input id="mgdl-owner-player-search"
               placeholder="Search username..." maxlength="20">

        <div id="mgdl-owner-player-results"></div>

        <form id="mgdl-owner-player-form" hidden>
          <h3 id="mgdl-owner-selected-name"></h3>

          <label for="mgdl-owner-hardest">Hardest completed level</label>
          <select id="mgdl-owner-hardest">
            <option value="">No hardest selected</option>
          </select>

          <label for="mgdl-owner-mv">MV points</label>
          <input id="mgdl-owner-mv" type="number"
                 min="0" max="100000000" required>

          <p class="mgdl-owner-help">
            MV points determine leaderboard placement. Hardest is display-only
            and does not change a player's MV or rank.
          </p>

          <button type="submit">SAVE PLAYER STATS</button>
          <button type="button" id="mgdl-owner-cancel">CANCEL</button>
        </form>
        <p class="mgdl-owner-status" id="mgdl-player-status"
           aria-live="polite"></p>
      </div>
    `;

    about.insertAdjacentElement("beforebegin", panel);

    const levelList = panel.querySelector("#mgdl-owner-level-list");
    const levelStatus = panel.querySelector("#mgdl-level-status");
    const playerStatus = panel.querySelector("#mgdl-player-status");
    const playerResults = panel.querySelector("#mgdl-owner-player-results");
    const playerForm = panel.querySelector("#mgdl-owner-player-form");
    const hardestSelect = panel.querySelector("#mgdl-owner-hardest");

    function status(element, message, error = false) {
      element.textContent = message;
      element.classList.toggle("error", error);
    }

    function safeVideoUrl(value) {
      if (!value) return null;
      try {
        const parsed = new URL(value);
        return parsed.protocol === "https:" ? parsed.href : null;
      } catch {
        return null;
      }
    }

    // ---------- TABS ----------
    panel.querySelectorAll("[data-tab]").forEach(button => {
      button.addEventListener("click", () => {
        panel.querySelectorAll("[data-tab]").forEach(tab => {
          tab.classList.toggle("active", tab === button);
        });
        panel.querySelectorAll("[data-content]").forEach(content => {
          content.hidden = content.dataset.content !== button.dataset.tab;
        });
      });
    });

    // ---------- RANKED LEVELS ----------
    async function fetchLevels() {
      const { data, error } = await supabaseClient
        .from("ranked_levels")
        .select("id, rank, name, mv_points, video_url")
        .order("rank", { ascending: true });

      if (error) throw error;
      rankedLevelNames = (data || []).map(level => level.name);
      refreshHardestOptions();
      return data || [];
    }

    function refreshHardestOptions(selectedValue = hardestSelect.value) {
      hardestSelect.replaceChildren();

      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "No hardest selected";
      hardestSelect.append(emptyOption);

      rankedLevelNames.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        hardestSelect.append(option);
      });

      if (selectedValue && rankedLevelNames.includes(selectedValue)) {
        hardestSelect.value = selectedValue;
      } else {
        hardestSelect.value = "";
      }
    }

    async function loadLevels() {
      levelList.textContent = "Loading levels...";

      let data;
      try {
        data = await fetchLevels();
      } catch (error) {
        levelList.textContent = "Could not load levels: " + error.message;
        return;
      }

      levelList.replaceChildren();

      if (!data.length) {
        levelList.textContent = "No ranked levels yet.";
        return;
      }

      data.forEach(level => {
        const row = document.createElement("div");
        row.className = "mgdl-owner-level";

        const info = document.createElement("span");
        info.textContent =
          "#" + level.rank + " · " + level.name + " · " + level.mv_points + " MV";

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "REMOVE";
        remove.addEventListener("click", async () => {
          if (!confirm("Remove " + level.name + " from the ranked list?")) return;

          remove.disabled = true;
          const { error } = await supabaseClient.rpc(
            "owner_remove_ranked_level_v2",
            { target_level_id: level.id }
          );

          if (error) {
            status(levelStatus, error.message, true);
            remove.disabled = false;
            return;
          }

          status(levelStatus, level.name + " removed.");
          await loadLevels();
          await syncPublicLevels();
        });

        row.append(info, remove);
        levelList.append(row);
      });
    }

    async function syncPublicLevels() {
      const { data, error } = await supabaseClient
        .from("ranked_levels")
        .select("rank, name, mv_points, video_url")
        .order("rank", { ascending: true });

      if (error) {
        console.error("Could not refresh public levels:", error);
        return;
      }

      if (typeof window.MGDL_setRankedLevels === "function") {
        window.MGDL_setRankedLevels(data || []);
      }
    }

    panel.querySelector("#mgdl-owner-add-level")
      .addEventListener("submit", async event => {
        event.preventDefault();

        const name = panel.querySelector("#mgdl-new-level").value.trim();
        const points = Number(panel.querySelector("#mgdl-new-points").value);
        const rawVideoUrl = panel.querySelector("#mgdl-new-video").value.trim();
        const videoUrl = safeVideoUrl(rawVideoUrl);

        if (!name || !Number.isInteger(points) || points < 0 || points > 100000) {
          status(levelStatus, "Enter a valid name and MV value.", true);
          return;
        }

        if (rawVideoUrl && !videoUrl) {
          status(levelStatus, "Enter a valid HTTPS video URL.", true);
          return;
        }

        const submit = event.currentTarget.querySelector('button[type="submit"]');
        submit.disabled = true;

        const { error } = await supabaseClient.rpc(
          "owner_add_ranked_level_v2",
          {
            new_name: name,
            new_mv_points: points,
            new_video_url: videoUrl
          }
        );

        submit.disabled = false;

        if (error) {
          status(levelStatus, error.message, true);
          return;
        }

        panel.querySelector("#mgdl-new-level").value = "";
        panel.querySelector("#mgdl-new-video").value = "";
        status(levelStatus, name + " added. Rankings reordered by MV points.");
        await loadLevels();
        await syncPublicLevels();
      });

    // ---------- PLAYER MANAGEMENT ----------
    let searchTimer = null;

    async function searchPlayers(query) {
      playerResults.replaceChildren();
      if (!query.trim()) return;

      playerResults.textContent = "Searching...";

      const { data, error } = await supabaseClient.rpc(
        "owner_search_players_v2",
        { search_text: query.trim() }
      );

      playerResults.replaceChildren();

      if (error) {
        status(playerStatus, error.message, true);
        return;
      }

      if (!data || !data.length) {
        playerResults.textContent = "No registered players found.";
        return;
      }

      data.forEach(player => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "mgdl-owner-player-result";
        button.textContent =
          player.username + " · Hardest: " + (player.hardest || "—") +
          " · " + player.mv_points + " MV";

        button.addEventListener("click", () => {
          selectedPlayer = player;

          panel.querySelector("#mgdl-owner-selected-name").textContent =
            "Editing " + player.username;

          refreshHardestOptions(player.hardest || "");
          panel.querySelector("#mgdl-owner-mv").value =
            Number(player.mv_points) || 0;

          playerForm.hidden = false;
          status(playerStatus, "");
        });

        playerResults.append(button);
      });
    }

    panel.querySelector("#mgdl-owner-player-search")
      .addEventListener("input", event => {
        clearTimeout(searchTimer);
        const query = event.target.value;
        searchTimer = setTimeout(() => searchPlayers(query), 250);
      });

    panel.querySelector("#mgdl-owner-cancel")
      .addEventListener("click", () => {
        selectedPlayer = null;
        playerForm.hidden = true;
      });

    playerForm.addEventListener("submit", async event => {
      event.preventDefault();
      if (!selectedPlayer) return;

      const hardest = hardestSelect.value || null;
      const mv = Number(panel.querySelector("#mgdl-owner-mv").value);

      if (!Number.isSafeInteger(mv) || mv < 0) {
        status(playerStatus, "Enter a valid non-negative MV value.", true);
        return;
      }

      if (hardest && !rankedLevelNames.includes(hardest)) {
        status(playerStatus, "Choose a level from the current ranked list.", true);
        return;
      }

      const submit = playerForm.querySelector('button[type="submit"]');
      submit.disabled = true;

      const { error } = await supabaseClient.rpc(
        "owner_set_player_stats_v2",
        {
          target_player_id: selectedPlayer.id,
          new_hardest: hardest,
          new_mv_points: mv
        }
      );

      submit.disabled = false;

      if (error) {
        status(playerStatus, error.message, true);
        return;
      }

      const savedUsername = selectedPlayer.username;
      status(playerStatus, "Stats saved for " + savedUsername + ".");
      selectedPlayer = null;
      playerForm.hidden = true;

      await searchPlayers(
        panel.querySelector("#mgdl-owner-player-search").value
      );
    });

    // ---------- AUTHORIZATION ----------
    async function checkOwner(session) {
      currentUser = session?.user || null;
      panel.hidden = true;

      if (!currentUser) return;

      const { data, error } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (error) {
        console.error("MGDL Owner role check:", error);
        return;
      }

      if (data?.role !== "owner") return;

      panel.hidden = false;
      await loadLevels();
      await syncPublicLevels();
    }

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      checkOwner(session);
    });

    supabaseClient.auth.getSession().then(({ data, error }) => {
      if (!error) checkOwner(data.session);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startOwnerPanel);
  } else {
    startOwnerPanel();
  }
})();
