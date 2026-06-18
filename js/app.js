// app.js

window.addEventListener("load", () => {
    initializeTheme();
    initializeSearch();
    initializeButtons();
    initializePlaylistManager();
});

function initializeTheme() {
    const theme = StorageManager.getTheme();
    if (theme === "light") {
        document.body.classList.add("light");
    }
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
        if (repeatMode === "off") {
            repeatMode = "one";
        } else if (repeatMode === "one") {
            repeatMode = "all";
        } else {
            repeatMode = "off";
        }
        StorageManager.saveRepeatMode(repeatMode);
        syncToggleStates();
    });

    document.getElementById("favoriteBtn").addEventListener("click", toggleFavorite);
    document.getElementById("themeBtn").addEventListener("click", toggleTheme);
}

function initializePlaylistManager() {
    const createBtn = document.getElementById("createPlaylistBtn");
    if (createBtn) {
        createBtn.addEventListener("click", () => {
            const name = prompt("Playlist name:");
            if (!name || !name.trim()) return;
            const id = StorageManager.createPlaylist(name.trim());
            switchPlaylist(id);
        });
    }
}

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
    const song = playlist[currentIndex];
    const btn = document.getElementById("favoriteBtn");
    const isFav = StorageManager.isFavorite(song.videoId);
    btn.innerHTML = isFav
        ? '<i class="fa-solid fa-heart"></i>'
        : '<i class="fa-regular fa-heart"></i>';
    btn.classList.toggle("fav-active", isFav);
    btn.title = isFav ? "Remove from Favorites" : "Add to Favorites";
}

function toggleTheme() {
    document.body.classList.toggle("light");
    const currentTheme = document.body.classList.contains("light") ? "light" : "dark";
    StorageManager.saveTheme(currentTheme);
    updateThemeIcon();
}
