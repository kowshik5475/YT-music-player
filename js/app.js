// app.js

window.addEventListener("load", () => {
    initializeTheme();
    initializeSearch();
    initializeButtons();
    initializeAddSongModal();
    initializePlaylistManager();
    initializeSidebar();
    initializeSidebarTabs();
});

/* ── Theme ─────────────────────────────────────────────────────────────── */
function initializeTheme() {
    if (StorageManager.getTheme() === "light") document.body.classList.add("light");
    updateThemeIcon();
}

function updateThemeIcon() {
    const btn = document.getElementById("themeBtn");
    if (!btn) return;
    const isLight = document.body.classList.contains("light");
    btn.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    btn.title = isLight ? "Switch to Dark Mode" : "Switch to Light Mode";
}

function toggleTheme() {
    document.body.classList.toggle("light");
    StorageManager.saveTheme(document.body.classList.contains("light") ? "light" : "dark");
    updateThemeIcon();
}

/* ── Sidebar collapse ──────────────────────────────────────────────────── */
function initializeSidebar() {
    const sidebar  = document.getElementById("sidebar");
    const overlay  = document.getElementById("sidebarOverlay");
    const toggleBtn = document.getElementById("sidebarToggle");
    if (!sidebar || !toggleBtn) return;

    const isMobile = () => window.innerWidth <= 680;

    function openSidebar() {
        sidebar.classList.remove("collapsed");
        if (isMobile()) { sidebar.classList.add("open"); overlay.classList.add("visible"); }
    }
    function closeSidebar() {
        if (isMobile()) { sidebar.classList.remove("open"); overlay.classList.remove("visible"); }
        else sidebar.classList.add("collapsed");
    }
    function toggleSidebar() {
        const isOpen = isMobile() ? sidebar.classList.contains("open") : !sidebar.classList.contains("collapsed");
        isOpen ? closeSidebar() : openSidebar();
    }

    toggleBtn.addEventListener("click", toggleSidebar);
    overlay.addEventListener("click", closeSidebar);
    window.addEventListener("resize", () => {
        if (!isMobile()) { overlay.classList.remove("visible"); sidebar.classList.remove("open"); }
    });
}

/* ── Sidebar tabs ──────────────────────────────────────────────────────── */
function initializeSidebarTabs() {
    document.querySelectorAll(".stab").forEach(tab => {
        tab.addEventListener("click", () => activateSidebarTab(tab.dataset.tab));
    });
}

function activateSidebarTab(tabName) {
    document.querySelectorAll(".stab").forEach(t =>
        t.classList.toggle("active", t.dataset.tab === tabName));
    document.querySelectorAll(".tab-panel").forEach(p =>
        p.classList.toggle("active", p.id === "tab-" + tabName));
}

/* ── Add Song modal ────────────────────────────────────────────────────── */
function initializeAddSongModal() {
    const modal        = document.getElementById("addSongModal");
    const openBtn      = document.getElementById("addSongBtn");
    const closeBtn     = document.getElementById("closeAddSongModal");
    const cancelBtn    = document.getElementById("cancelAddSong");
    const cancelManual = document.getElementById("cancelAddSongManual");
    if (!modal) return;

    // ── Open / close ──
    function openModal() {
        resetAddSongModal();
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
        setTimeout(() => document.getElementById("ytUrlInput")?.focus(), 80);
    }
    function closeModal() {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
    }
    if (openBtn)      openBtn.addEventListener("click", openModal);
    if (closeBtn)     closeBtn.addEventListener("click", closeModal);
    if (cancelBtn)    cancelBtn.addEventListener("click", closeModal);
    if (cancelManual) cancelManual.addEventListener("click", closeModal);
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

    // ── Source tab switching ──
    document.querySelectorAll(".add-song-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".add-song-tab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".add-song-panel").forEach(p => p.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById("panel-" + tab.dataset.source)?.classList.add("active");
        });
    });

    // ── YouTube URL panel ──
    let _fetchedSong = null;

    const urlInput   = document.getElementById("ytUrlInput");
    const fetchBtn   = document.getElementById("fetchInfoBtn");
    const hint       = document.getElementById("ytUrlHint");
    const preview    = document.getElementById("songPreview");
    const confirmBtn = document.getElementById("confirmAddSong");

    async function doFetch() {
        const raw = urlInput?.value.trim();
        if (!raw) { setHint(hint, "Paste a YouTube URL or video ID first.", "error"); return; }

        const videoId = parseYouTubeId(raw);
        if (!videoId) { setHint(hint, "Couldn't find a valid YouTube video ID — check the URL.", "error"); return; }

        if (StorageManager.isInLibrary(videoId)) {
            setHint(hint, "This song is already in your library.", "warn");
            const existing = StorageManager.getLibrarySong(videoId);
            showPreview(existing);
            _fetchedSong = existing;
            confirmBtn.disabled = false;
            return;
        }

        setHint(hint, "", "");
        fetchBtn.classList.add("loading");
        fetchBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        confirmBtn.disabled = true;
        preview.style.display = "none";
        _fetchedSong = null;

        try {
            const song = await fetchVideoById(videoId);
            _fetchedSong = song;
            showPreview(song);
            setHint(hint, "", "");
            confirmBtn.disabled = false;
        } catch (e) {
            setHint(hint, "Couldn't fetch video info. Check the ID or try again.", "error");
        } finally {
            fetchBtn.classList.remove("loading");
            fetchBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
        }
    }

    function showPreview(song) {
        document.getElementById("previewThumb").src    = song.cover;
        document.getElementById("previewTitle").textContent  = song.title;
        document.getElementById("previewArtist").textContent = song.artist;
        document.getElementById("previewVid").textContent    = "ID: " + song.videoId;
        preview.style.display = "flex";
    }

    fetchBtn?.addEventListener("click", doFetch);
    urlInput?.addEventListener("keydown", e => { if (e.key === "Enter") doFetch(); });

    // Auto-fetch on paste after a short delay
    urlInput?.addEventListener("paste", () => {
        setTimeout(doFetch, 120);
    });

    confirmBtn?.addEventListener("click", () => {
        if (!_fetchedSong) return;
        StorageManager.addToLibrary(_fetchedSong);
        renderAll();
        activateSidebarTab("songs");
        closeModal();
        showToast(`"${_fetchedSong.title}" added to library`);
    });

    // ── Manual panel ──
    document.getElementById("confirmAddSongManual")?.addEventListener("click", () => {
        const title   = document.getElementById("manualTitle")?.value.trim();
        const artist  = document.getElementById("manualArtist")?.value.trim();
        const videoId = document.getElementById("manualVideoId")?.value.trim();
        const cover   = document.getElementById("manualCover")?.value.trim();
        const mhint   = document.getElementById("manualHint");

        if (!title || !artist || !videoId) {
            if (mhint) { mhint.textContent = "Title, artist and video ID are all required."; }
            return;
        }
        if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
            if (mhint) { mhint.textContent = "Video ID must be exactly 11 characters (letters, numbers, _ -)"; }
            return;
        }

        const song = {
            videoId,
            title,
            artist,
            cover: cover || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
        };
        StorageManager.addToLibrary(song);
        renderAll();
        activateSidebarTab("songs");
        closeModal();
        showToast(`"${title}" added to library`);
    });
}

function resetAddSongModal() {
    // URL panel
    const urlInput = document.getElementById("ytUrlInput");
    if (urlInput) urlInput.value = "";
    const hint = document.getElementById("ytUrlHint");
    if (hint) { hint.textContent = ""; hint.className = "field-hint"; }
    const preview = document.getElementById("songPreview");
    if (preview) preview.style.display = "none";
    const confirmBtn = document.getElementById("confirmAddSong");
    if (confirmBtn) confirmBtn.disabled = true;

    // Manual panel
    ["manualTitle","manualArtist","manualVideoId","manualCover"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    const mhint = document.getElementById("manualHint");
    if (mhint) mhint.textContent = "";

    // Reset to URL tab
    document.querySelectorAll(".add-song-tab").forEach(t =>
        t.classList.toggle("active", t.dataset.source === "url"));
    document.querySelectorAll(".add-song-panel").forEach(p =>
        p.classList.toggle("active", p.id === "panel-url"));
}

function setHint(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.className = "field-hint" + (type === "error" ? " hint-error" : type === "warn" ? " hint-warn" : "");
}

/* ── Toast notification ─────────────────────────────────────────────────── */
function showToast(msg) {
    document.querySelectorAll(".toast-msg").forEach(t => t.remove());
    const toast = document.createElement("div");
    toast.className = "toast-msg";
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${msg}`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
    }, 2800);
}

/* ── Playlist manager (modal) ──────────────────────────────────────────── */
function initializePlaylistManager() {
    const createBtn   = document.getElementById("createPlaylistBtn");
    const modal       = document.getElementById("createPlaylistModal");
    const closeBtn    = document.getElementById("closeCreateModal");
    const cancelBtn   = document.getElementById("cancelCreatePlaylist");
    const confirmBtn  = document.getElementById("confirmCreatePlaylist");
    const nameInput   = document.getElementById("plNameInput");
    const descInput   = document.getElementById("plDescInput");
    const nameHint    = document.getElementById("plNameHint");

    if (!modal) return;

    function openModal() {
        nameInput.value = "";
        descInput.value = "";
        if (nameHint) nameHint.textContent = "";
        nameInput.classList.remove("input-error");
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
        setTimeout(() => nameInput.focus(), 80);
    }

    function closeModal() {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
    }

    function doCreate() {
        const name = nameInput.value.trim();
        if (!name) {
            nameInput.classList.add("input-error");
            if (nameHint) nameHint.textContent = "Please enter a name.";
            nameInput.focus();
            return;
        }
        const desc = descInput ? descInput.value.trim() : "";
        const id   = StorageManager.createPlaylist(name, desc);
        closeModal();
        renderAll();
        // Drill into new playlist so user can start adding songs
        openPlaylistDetail(id);
        activateSidebarTab("playlists");
    }

    if (createBtn)  createBtn.addEventListener("click", openModal);
    if (closeBtn)   closeBtn.addEventListener("click", closeModal);
    if (cancelBtn)  cancelBtn.addEventListener("click", closeModal);
    if (confirmBtn) confirmBtn.addEventListener("click", doCreate);

    // Enter key in name field triggers create
    if (nameInput) {
        nameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") doCreate();
            else nameInput.classList.remove("input-error");
        });
    }

    // Click outside modal-box closes it
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });
}

/* ── Player buttons ────────────────────────────────────────────────────── */
function initializeButtons() {
    document.getElementById("playBtn").addEventListener("click", togglePlay);
    document.getElementById("nextBtn").addEventListener("click", nextSong);
    document.getElementById("prevBtn").addEventListener("click", previousSong);

    const shuffleBtn = document.getElementById("shuffleBtn");
    shuffleBtn.addEventListener("click", () => {
        shuffleMode = !shuffleMode;
        StorageManager.saveShuffleMode(shuffleMode);
        shuffleBtn.classList.toggle("active-toggle", shuffleMode);
        shuffleBtn.title = shuffleMode ? "Shuffle: On" : "Shuffle: Off";
    });

    const repeatBtn = document.getElementById("repeatBtn");
    repeatBtn.addEventListener("click", () => {
        repeatMode = repeatMode === "off" ? "one" : repeatMode === "one" ? "all" : "off";
        StorageManager.saveRepeatMode(repeatMode);
        syncToggleStates();
    });

    document.getElementById("favoriteBtn").addEventListener("click", toggleFavorite);
    document.getElementById("themeBtn").addEventListener("click", toggleTheme);
}

/* ── Favorites ─────────────────────────────────────────────────────────── */
function toggleFavorite() {
    if (!playlist.length) return;
    const song = playlist[currentIndex];
    if (StorageManager.isFavorite(song.videoId)) {
        StorageManager.removeFavorite(song.videoId);
    } else {
        StorageManager.addFavorite(song);
    }
    renderFavorites();
    updateFavoriteButton();
}

function updateFavoriteButton() {
    if (!playlist.length) return;
    const song  = playlist[currentIndex];
    const btn   = document.getElementById("favoriteBtn");
    const isFav = StorageManager.isFavorite(song.videoId);
    btn.innerHTML = isFav ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
    btn.classList.toggle("fav-active", isFav);
    btn.title = isFav ? "Remove from Favorites" : "Add to Favorites";
}
