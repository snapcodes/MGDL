
/* =========================================
   MGDL PROFILE EDITOR
   Supports private avatar and animated GIF banners
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

    // Add the profile button.
    const profileButton = document.createElement("button");
    profileButton.type = "button";
    profileButton.textContent = "Edit profile";
    profileButton.className = "account-button";
    profileButton.hidden = true;
    accountButton.insertAdjacentElement("afterend", profileButton);

    // Build the profile editor.
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
          placeholder="Your username"
        >

        <label>Profile picture</label>
        <div class="avatar-preview">
          <img id="mgdl-avatar-preview" alt="Avatar preview">
        </div>
        <input
          id="mgdl-avatar-file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
        >
        <p class="file-hint">
          PNG, JPG, WebP or GIF. Maximum 8 MB.
        </p>

        <label>Profile banner</label>
        <div class="profile-preview">
          <img id="mgdl-banner-preview" alt="Banner preview">
        </div>
        <input
          id="mgdl-banner-file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
        >
        <p class="file-hint">
          Animated GIFs are supported. Maximum 8 MB.
        </p>

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

    function setBusy(busy) {
      saveButton.disabled = busy;
      saveButton.textContent = busy ? "SAVING..." : "SAVE PROFILE";
    }

    async function getImageUrl(path) {
      if (!path) return null;

      // Support an existing external image URL.
      if (/^https?:\/\//i.test(path)) return path;

      const { data, error } = await supabaseClient.storage
        .from(BUCKET)
        .createSignedUrl(path, 3600);

      if (error) throw error;
      return data.signedUrl;
    }

    async function loadProfile(session) {
      currentUser = session?.user || null;
      profileButton.hidden = !currentUser;

      if (!currentUser) {
        editor.hidden = true;
        return;
      }

      const { data, error } = await supabaseClient
        .from("profiles")
        .select("username, avatar_url, banner_url")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (error) {
        setStatus("Could not load your profile: " + error.message, "error");
        return;
      }

      if (!data) {
        setStatus(
          "Your profile hasn't been created yet. Please contact an MGDL developer.",
          "error"
        );
        return;
      }

      usernameInput.value = data.username || "";

      savedAvatarPath = data.avatar_url || null;
      savedBannerPath = data.banner_url || null;

      try {
        avatarPreview.src =
          await getImageUrl(savedAvatarPath) || DEFAULT_AVATAR;

        const bannerUrl = await getImageUrl(savedBannerPath);

        bannerPreview.hidden = !bannerUrl;

        if (bannerUrl) {
          bannerPreview.src = bannerUrl;
        }
      } catch (error) {
        console.error("MGDL profile image error:", error);
        setStatus("Could not load your profile images.", "error");
      }
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

      const extension = extensions[file.type];
      const path =
        currentUser.id + "/" + folder + "-" +
        Date.now() + "." + extension;

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

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (!currentUser) {
        setStatus("Please sign in first.", "error");
        return;
      }

      const username = usernameInput.value.trim();

      if (username.length < 3 || username.length > 20) {
        setStatus("Username must be 3–20 characters.", "error");
        return;
      }

      setBusy(true);
      setStatus("Saving your profile...");

      try {
        let avatarPath = savedAvatarPath;
        let bannerPath = savedBannerPath;

        const avatarFile = avatarInput.files?.[0];
        const bannerFile = bannerInput.files?.[0];

        if (avatarFile) {
          avatarPath = await uploadImage(avatarFile, "avatar");
        }

        if (bannerFile) {
          bannerPath = await uploadImage(bannerFile, "banner");
        }

        const { error } = await supabaseClient
          .from("profiles")
          .update({
            username: username,
            avatar_url: avatarPath,
            banner_url: bannerPath
          })
          .eq("id", currentUser.id);

        if (error) throw error;

        savedAvatarPath = avatarPath;
        savedBannerPath = bannerPath;

        avatarInput.value = "";
        bannerInput.value = "";

        avatarPreview.src =
          await getImageUrl(savedAvatarPath) || DEFAULT_AVATAR;

        const bannerUrl = await getImageUrl(savedBannerPath);
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

    // Keep profile access synchronized with sign-in/sign-out.
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
