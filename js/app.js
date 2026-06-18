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
    const theme = StorageManager.getTheme();
    if (theme === "light") document.body.classList.add("light");
    updateThemeIcon();
}

function updateThemeIcon() {
    const btn = document.getElementById("themeBtn");
    if (!btn) return;
    const isLight = document.body.classList.contains("light");
    btn.innerHTML = isLight
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
    btn.title = isLight ? "Switch to Dark Mode" : "Switch to Light Mode";
}

function toggleTheme() {
    document.body.classList.toggle("light");
    StorageManager.saveTheme(
        document.body.classList.contains("light") ? "light" : "dark"
    );
    updateThemeIcon();
}

/* ── Sidebar toggle ────────────────────────────────────────────────────── */
function initializeSidebar() {
    const sidebar  = document.getElementById("sidebar");
    const overlay  = document.getElementById("sidebarOverlay");
    const toggleBtn = document.getElementById("sidebarToggle");
    if (!sidebar || !toggleBtn) return;

    const isMobile = () => window.innerWidth <= 680;

    function openSidebar() {
        if (isMobile()) {
            sidebar.classList.remove("collapsed");
            sidebar.classList.add("open");
            overlay.classList.add("visible");
        } else {
            sidebar.classList.remove("collapsed");
        }
    }

    function closeSidebar() {
        if (isMobile()) {
            sidebar.classList.remove("open");
            overlay.classList.remove("visible");
        } else {
            sidebar.classList.add("collapsed");
        }
    }

    function toggleSidebar() {
        const isOpen = isMobile()
            ? sidebar.classList.contains("open")
            : !sidebar.classList.contains("collapsed");
        isOpen ? closeSidebar() : openSidebar();
    }

    toggleBtn.addEventListener("click", toggleSidebar);
    overlay.addEventListener("click", closeSidebar);

    // Close on resize direction flip
    window.addEventListener("resize", () => {
        if (!isMobile()) {
            overlay.classList.remove("visible");
            sidebar.classList.remove("open");
        }
    });
}

/* ── Sidebar tabs ──────────────────────────────────────────────────────── */
function initializeSidebarTabs() {
    const tabs   = document.querySelectorAll(".stab");
    const panels = document.querySelectorAll(".tab-panel");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove("active"));
            panels.forEach(p => p.classList.remove("active"));
            tab.classList.add("active");
            const panel = document.getElementById("tab-" + target);
            if (panel) panel.classList.add("active");
        });
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
        repeatMode = repeatMode === "off" ? "one"
                   : repeatMode === "one" ? "all"
                   : "off";
        StorageManager.saveRepeatMode(repeatMode);
        syncToggleStates();
    });

    document.getElementById("favoriteBtn").addEventListener("click", toggleFavorite);
    document.getElementById("themeBtn").addEventListener("click", toggleTheme);
}

/* ── Playlist manager ──────────────────────────────────────────────────── */
function initializePlaylistManager() {
    const createBtn = document.getElementById("createPlaylistBtn");
    if (!createBtn) return;
    createBtn.addEventListener("click", () => {
        const name = prompt("New playlist name:");
        if (!name || !name.trim()) return;
        const id = StorageManager.createPlaylist(name.trim());
        switchPlaylist(id);
        // Switch to the Playlists tab so the user sees the new playlist
        activateSidebarTab("playlists");
    });
}

/* helper: activate a tab by name */
function activateSidebarTab(tabName) {
    document.querySelectorAll(".stab").forEach(t =>
        t.classList.toggle("active", t.dataset.tab === tabName));
    document.querySelectorAll(".tab-panel").forEach(p =>
        p.classList.toggle("active", p.id === "tab-" + tabName));
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
    const song   = playlist[currentIndex];
    const btn    = document.getElementById("favoriteBtn");
    const isFav  = StorageManager.isFavorite(song.videoId);
    btn.innerHTML = isFav
        ? '<i class="fa-solid fa-heart"></i>'
        : '<i class="fa-regular fa-heart"></i>';
    btn.classList.toggle("fav-active", isFav);
    btn.title = isFav ? "Remove from Favorites" : "Add to Favorites";
}
