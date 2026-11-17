
/* =========================================
   MGDL PROFILE SYSTEM
   Editing, public profiles and player search
   ========================================= */

(() => {
  const DEFAULT_AVATAR = "https://kommodo.ai/i/hDUGxuGhotMdYGyku63G";
  const BUCKET = "profile-media";
  const MAX_FILE_SIZE = 8 * 1024 * 1024;

  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif"
  ];

  function startProfileEditor() {
    if (typeof supabaseClient === "undefined") {
      console.error("MGDL: Supabase client not found.");
      return;
    }

    const accountButton = document.getElementById("account-open");
    const aboutSection = document.getElementById("about");

    if (!accountButton || !aboutSection) return;

    // Profile action buttons
    const profileButton = document.createElement("button");
    profileButton.type = "button";
    profileButton.textContent = "Edit Profile";
    profileButton.className = "account-button";
    profileButton.hidden = true;

    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.textContent = "View Profile";
    viewButton.className = "account-button";
    viewButton.hidden = true;

    accountButton.insertAdjacentElement("afterend", profileButton);
    profileButton.insertAdjacentElement("afterend", viewButton);

    // Public player search
    const searchSection = document.createElement("section");
    searchSection.className = "mgdl-player-search";
    searchSection.innerHTML = `
      <h2>FIND PLAYERS</h2>
      <p>Search for MGDL players by username.</p>
      <form id="mgdl-search-form">
        <input
          id="mgdl-player-search"
          type="search"
          maxlength="20"
          placeholder="Search usernames..."
          autocomplete="off"
        >
        <button type="submit">SEARCH</button>
      </form>
      <div id="mgdl-search-results" aria-live="polite"></div>
    `;

    aboutSection.insertAdjacentElement("beforebegin", searchSection);

    const searchForm = searchSection.querySelector("#mgdl-search-form");
    const searchInput = searchSection.querySelector("#mgdl-player-search");
    const searchResults = searchSection.querySelector("#mgdl-search-results");

    // Profile editor
    const editor = document.createElement("section");
    editor.className = "profile-editor";
    editor.hidden = true;

    editor.innerHTML = `
      <h2>EDIT YOUR PROFILE</h2>
      <p class="profile-description">
        Customize your MGDL identity.
      </p>

      <form id="mgdl-profile-form">

        <label for="mgdl-username">Username</label>
        <input
          id="mgdl-username"
          type="text"
          minlength="3"
          maxlength="20"
          required
          autocomplete="nickname"
          placeholder="Your unique username"
        >

        <label for="mgdl-bio">Bio</label>
        <input
          id="mgdl-bio"
          type="text"
          maxlength="30"
          placeholder="Tell players about yourself..."
        >
        <p class="mgdl-bio-counter">0/30 characters</p>

        <label>Profile picture</label>
        <div class="avatar-preview">
          <img id="mgdl-avatar-preview" alt="Avatar preview">
        </div>
        <input
          id="mgdl-avatar-file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
        >
        <p class="file-hint">PNG, JPG, WebP or GIF. Maximum 8 MB.</p>

        <label>Profile banner</label>
        <div class="profile-preview">
          <img id="mgdl-banner-preview" alt="Banner preview">
        </div>
        <input
          id="mgdl-banner-file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
        >
        <p class="file-hint">Animated GIFs supported. Maximum 8 MB.</p>

        <button class="profile-save" type="submit">
          SAVE PROFILE
        </button>

        <p class="profile-status" id="mgdl-profile-status"
           role="status" aria-live="polite"></p>
      </form>
    `;

    aboutSection.insertAdjacentElement("beforebegin", editor);

    const form = editor.querySelector("#mgdl-profile-form");
    const usernameInput = editor.querySelector("#mgdl-username");
    const bioInput = editor.querySelector("#mgdl-bio");
    const bioCounter = editor.querySelector(".mgdl-bio-counter");
    const avatarInput = editor.querySelector("#mgdl-avatar-file");
    const bannerInput = editor.querySelector("#mgdl-banner-file");
    const avatarPreview = editor.querySelector("#mgdl-avatar-preview");
    const bannerPreview = editor.querySelector("#mgdl-banner-preview");
    const status = editor.querySelector("#mgdl-profile-status");
    const saveButton = editor.querySelector(".profile-save");

    let currentUser = null;
    let savedAvatarPath = null;
    let savedBannerPath = null;

    function setStatus(message, type = "") {
      status.textContent = message;
      status.className = "profile-status " + type;
    }

    function updateBioCounter() {
      const length = Array.from(bioInput.value).length;
      bioCounter.textContent = `${length}/30 characters`;
    }

    bioInput.addEventListener("input", updateBioCounter);

    function setBusy(busy) {
      saveButton.disabled = busy;
      saveButton.textContent = busy ? "SAVING..." : "SAVE PROFILE";
    }

    // Public bucket URLs
    function getImageUrl(path) {
      if (!path) return null;

      if (/^https?:\/\//i.test(path)) return path;

      const { data } = supabaseClient.storage
        .from(BUCKET)
        .getPublicUrl(path);

      return data.publicUrl;
    }

    async function loadProfile(session) {
      currentUser = session?.user || null;

      profileButton.hidden = !currentUser;
      viewButton.hidden = !currentUser;

      if (!currentUser) {
        editor.hidden = true;
        return;
      }

      const { data, error } = await supabaseClient
        .from("profiles")
        .select("username, bio, avatar_url, banner_url")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (error) {
        setStatus("Could not load profile: " + error.message, "error");
        return;
      }

      if (!data) {
        setStatus("Your profile has not been created yet.", "error");
        return;
      }

      usernameInput.value = data.username || "";
      bioInput.value = data.bio || "";
      updateBioCounter();

      savedAvatarPath = data.avatar_url || null;
      savedBannerPath = data.banner_url || null;

      avatarPreview.src =
        getImageUrl(savedAvatarPath) || DEFAULT_AVATAR;

      const bannerUrl = getImageUrl(savedBannerPath);
      bannerPreview.hidden = !bannerUrl;

      if (bannerUrl) bannerPreview.src = bannerUrl;
    }

    function previewFile(input, preview, fallback = null) {
      const file = input.files?.[0];

      if (!file) {
        if (fallback) preview.src = fallback;
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        input.value = "";
        setStatus("Unsupported image type.", "error");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        input.value = "";
        setStatus("Image must be smaller than 8 MB.", "error");
        return;
      }

      preview.src = URL.createObjectURL(file);
      preview.hidden = false;
      setStatus("");
    }

    avatarInput.addEventListener("change", () => {
      previewFile(avatarInput, avatarPreview, DEFAULT_AVATAR);
    });

    bannerInput.addEventListener("change", () => {
      previewFile(bannerInput, bannerPreview);
    });

    async function uploadImage(file, folder) {
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Unsupported image format.");
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error("Images must be smaller than 8 MB.");
      }

      const extensions = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
        "image/gif": "gif"
      };

      const path =
        currentUser.id + "/" + folder + "-" +
        Date.now() + "." + extensions[file.type];

      const { error } = await supabaseClient.storage
        .from(BUCKET)
        .upload(path, file, {
          upsert: false,
          contentType: file.type,
          cacheControl: "3600"
        });

      if (error) throw error;

      return path;
    }

    // Save profile
    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (!currentUser) {
        setStatus("Please sign in first.", "error");
        return;
      }

      const username = usernameInput.value.trim();
      const bio = bioInput.value.trim();

      if (username.length < 3 || username.length > 20) {
        setStatus("Username must be 3–20 characters.", "error");
        return;
      }

      if (Array.from(bio).length > 30) {
        setStatus("Your bio must be 30 characters or less.", "error");
        return;
      }

      setBusy(true);
      setStatus("Saving your profile...");

      try {
        let avatarPath = savedAvatarPath;
        let bannerPath = savedBannerPath;

        if (avatarInput.files?.[0]) {
          avatarPath = await uploadImage(avatarInput.files[0], "avatar");
        }

        if (bannerInput.files?.[0]) {
          bannerPath = await uploadImage(bannerInput.files[0], "banner");
        }

        const { error } = await supabaseClient
          .from("profiles")
          .update({
            username,
            bio,
            avatar_url: avatarPath,
            banner_url: bannerPath
          })
          .eq("id", currentUser.id);

        if (error) {
          if (error.code === "23505") {
            throw new Error(
              "That username is already taken. Try another one."
            );
          }
          throw error;
        }

        savedAvatarPath = avatarPath;
        savedBannerPath = bannerPath;

        avatarInput.value = "";
        bannerInput.value = "";

        avatarPreview.src =
          getImageUrl(savedAvatarPath) || DEFAULT_AVATAR;

        const bannerUrl = getImageUrl(savedBannerPath);
        bannerPreview.hidden = !bannerUrl;

        if (bannerUrl) bannerPreview.src = bannerUrl;

        setStatus("Profile saved successfully!", "success");

        if (typeof showToast === "function") {
          showToast("Profile updated!");
        }
      } catch (error) {
        console.error("MGDL profile save error:", error);
        setStatus(error.message || "Could not save profile.", "error");
      } finally {
        setBusy(false);
      }
    });

    // Profile viewer
    const viewer = document.createElement("section");
    viewer.className = "mgdl-profile-viewer";
    viewer.hidden = true;

    viewer.innerHTML = `
      <div class="mgdl-viewer-top">
        <button type="button" class="mgdl-viewer-close">✕ CLOSE</button>
      </div>
      <div class="mgdl-viewer-banner"></div>
      <div class="mgdl-viewer-details">
        <img class="mgdl-viewer-avatar" alt="Player avatar">
        <h2 class="mgdl-viewer-username"></h2>
        <p class="mgdl-viewer-bio"></p>
        <p class="mgdl-viewer-joined">MGDL PLAYER</p>
      </div>
    `;

    document.body.appendChild(viewer);

    const viewerBanner = viewer.querySelector(".mgdl-viewer-banner");
    const viewerAvatar = viewer.querySelector(".mgdl-viewer-avatar");
    const viewerUsername = viewer.querySelector(".mgdl-viewer-username");
    const viewerBio = viewer.querySelector(".mgdl-viewer-bio");

    function closeViewer() {
      viewer.hidden = true;
    }

    viewer.querySelector(".mgdl-viewer-close")
      .addEventListener("click", closeViewer);

    async function showPublicProfile(profile) {
      if (!profile) return;

      viewerUsername.textContent = profile.username || "MGDL Player";
      viewerBio.textContent = profile.bio || "No bio yet.";
      viewerAvatar.src =
        getImageUrl(profile.avatar_url) || DEFAULT_AVATAR;

      const bannerUrl = getImageUrl(profile.banner_url);

      viewerBanner.style.backgroundImage = bannerUrl
        ? `url("${bannerUrl.replace(/["\\]/g, "")}")`
        : "none";

      viewer.hidden = false;
      viewer.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    async function loadPublicProfile(userId) {
      const { data, error } = await supabaseClient
        .from("public_profiles")
        .select("id, username, bio, avatar_url, banner_url")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error(error);
        if (typeof showToast === "function") {
          showToast("Could not load that profile.");
        }
        return;
      }

      if (!data) {
        if (typeof showToast === "function") {
          showToast("Player profile not found.");
        }
        return;
      }

      await showPublicProfile(data);
    }

    // View own profile
    viewButton.addEventListener("click", async () => {
      if (!currentUser) return;
      await loadPublicProfile(currentUser.id);
    });

    // Public username search
    searchForm.addEventListener("submit", async event => {
      event.preventDefault();

      const query = searchInput.value.trim();

      if (query.length < 1) {
        searchResults.textContent = "Enter a username to search.";
        return;
      }

      searchResults.textContent = "Searching...";

      const { data, error } = await supabaseClient
        .from("public_profiles")
        .select("id, username, bio, avatar_url")
        .ilike("username", `%${query}%`)
        .limit(12);

      if (error) {
        console.error(error);
        searchResults.textContent = "Search failed. Please try again.";
        return;
      }

      searchResults.replaceChildren();

      if (!data || data.length === 0) {
        searchResults.textContent = "No players found.";
        return;
      }

      data.forEach(profile => {
        const result = document.createElement("button");
        result.type = "button";
        result.className = "mgdl-search-result";

        const avatar = document.createElement("img");
        avatar.src = getImageUrl(profile.avatar_url) || DEFAULT_AVATAR;
        avatar.alt = "";

        const info = document.createElement("span");

        const username = document.createElement("strong");
        username.textContent = profile.username;

        const bio = document.createElement("small");
        bio.textContent = profile.bio || "No bio yet.";

        info.append(username, bio);
        result.append(avatar, info);

        result.addEventListener("click", () => {
          loadPublicProfile(profile.id);
        });

        searchResults.appendChild(result);
      });
    });

    // Edit profile button
    profileButton.addEventListener("click", async () => {
      if (!currentUser) return;

      editor.hidden = !editor.hidden;

      if (!editor.hidden) {
        await loadProfile({ user: currentUser });

        editor.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    });

    // Keep profile buttons synchronized with login state
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      loadProfile(session);
    });

    supabaseClient.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error(error);
        return;
      }

      loadProfile(data.session);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startProfileEditor);
  } else {
    startProfileEditor();
  }
})();

