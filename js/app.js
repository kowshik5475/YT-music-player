// app.js

window.addEventListener("load", () => {
    initializeTheme();
    initializeSearch();
    initializeButtons();
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
