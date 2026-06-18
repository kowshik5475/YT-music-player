// playlist.js

// Initialize playlist immediately from storage so it's ready before
// onYouTubeIframeAPIReady fires (no async dependency on loadActivePlaylist)
let activePlaylistId = StorageManager.getActivePlaylistId();
let _activePL = StorageManager.getActivePlaylist();
let playlist = _activePL ? [...(_activePL.songs || [])] : [];
let currentIndex = 0;

function loadActivePlaylist() {
    try {
        const pl = StorageManager.getActivePlaylist();
        if (!pl) return;
        activePlaylistId = pl.id;
        playlist = [...(pl.songs || [])];
        currentIndex = 0;
    } catch (e) {
        console.error("loadActivePlaylist error:", e);
    }
}

function renderSidebarPlaylists() {
    const container = document.getElementById("playlistsNav");
    if (!container) return;
    const playlists = StorageManager.getPlaylists();
    const activeId = StorageManager.getActivePlaylistId();
    container.innerHTML = "";
    Object.values(playlists).forEach(pl => {
        const item = document.createElement("div");
        item.className = "playlist-nav-item" + (pl.id === activeId ? " active" : "");
        item.innerHTML = `
            <span class="pl-name"><i class="fa-solid fa-music"></i> ${escapeHtml(pl.name)}</span>
            <div class="pl-actions">
                ${pl.id !== "default" ? `<button class="pl-del-btn" title="Delete playlist" data-id="${pl.id}"><i class="fa-solid fa-trash"></i></button>` : ""}
            </div>
        `;
        item.querySelector(".pl-name").addEventListener("click", () => switchPlaylist(pl.id));
        const delBtn = item.querySelector(".pl-del-btn");
        if (delBtn) {
            delBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (confirm(`Delete playlist "${pl.name}"?`)) {
                    StorageManager.deletePlaylist(pl.id);
                    loadActivePlaylist();
                    renderAll();
                    if (typeof onPlaylistSwitch === "function") onPlaylistSwitch();
                }
            });
        }
        container.appendChild(item);
    });
}

function switchPlaylist(id) {
    StorageManager.setActivePlaylistId(id);
    activePlaylistId = id;
    loadActivePlaylist();
    renderAll();
    if (typeof onPlaylistSwitch === "function") onPlaylistSwitch();
}

function renderPlaylist() {
    const el = document.getElementById("playlist");
    if (!el) return;
    el.innerHTML = "";
    if (!playlist.length) {
        el.innerHTML = '<li class="empty-msg">No songs yet. Search YouTube to add some!</li>';
        return;
    }
    playlist.forEach((song, index) => {
        const li = document.createElement("li");
        li.className = "song-item" + (index === currentIndex ? " active-song" : "");
        li.innerHTML = `
            <div class="song-item-info" data-index="${index}">
                <img src="${song.cover}" alt="" class="song-thumb" onerror="this.src='https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100'">
                <div>
                    <strong>${escapeHtml(song.title)}</strong>
                    <small>${escapeHtml(song.artist)}</small>
                </div>
            </div>
            <button class="remove-song-btn" title="Remove song" data-videoid="${song.videoId}"><i class="fa-solid fa-xmark"></i></button>
        `;
        li.querySelector(".song-item-info").addEventListener("click", () => loadSong(index));
        li.querySelector(".remove-song-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            removeSongFromCurrentPlaylist(song.videoId);
        });
        el.appendChild(li);
    });
}

function removeSongFromCurrentPlaylist(videoId) {
    const wasPlaying = playlist[currentIndex] && playlist[currentIndex].videoId === videoId;
    StorageManager.removeSongFromPlaylist(activePlaylistId, videoId);
    loadActivePlaylist();
    if (wasPlaying) {
        if (playlist.length > 0) {
            if (currentIndex >= playlist.length) currentIndex = playlist.length - 1;
            loadSong(currentIndex);
        } else {
            document.getElementById("songTitle").textContent = "No songs";
            document.getElementById("artistName").textContent = "";
            document.getElementById("coverImage").src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800";
            if (typeof player !== "undefined" && player && player.stopVideo) player.stopVideo();
        }
    }
    renderPlaylist();
}

function renderFavorites() {
    const list = document.getElementById("favoritesList");
    if (!list) return;
    list.innerHTML = "";
    const favorites = StorageManager.getFavorites();
    if (!favorites.length) {
        list.innerHTML = '<li class="empty-msg">No favorites yet.</li>';
        return;
    }
    favorites.forEach(song => {
        const li = document.createElement("li");
        li.className = "song-item";
        li.innerHTML = `
            <div class="song-item-info">
                <img src="${song.cover}" alt="" class="song-thumb" onerror="this.src='https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100'">
                <div>
                    <strong>${escapeHtml(song.title)}</strong>
                    <small>${escapeHtml(song.artist)}</small>
                </div>
            </div>
            <button class="remove-song-btn fav-remove" title="Remove from favorites"><i class="fa-solid fa-heart-crack"></i></button>
        `;
        li.querySelector(".song-item-info").addEventListener("click", () => {
            const idx = playlist.findIndex(s => s.videoId === song.videoId);
            if (idx !== -1) {
                loadSong(idx);
            } else {
                StorageManager.addSongToPlaylist(activePlaylistId, song);
                loadActivePlaylist();
                const newIdx = playlist.findIndex(s => s.videoId === song.videoId);
                renderPlaylist();
                if (newIdx !== -1) loadSong(newIdx);
            }
        });
        li.querySelector(".remove-song-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            StorageManager.removeFavorite(song.videoId);
            renderFavorites();
            if (typeof updateFavoriteButton === "function") updateFavoriteButton();
        });
        list.appendChild(li);
    });
}

function renderRecentSongs() {
    const list = document.getElementById("recentList");
    if (!list) return;
    list.innerHTML = "";
    const recent = StorageManager.getRecentSongs();
    if (!recent.length) {
        list.innerHTML = '<li class="empty-msg">Nothing played yet.</li>';
        return;
    }
    recent.forEach(song => {
        const li = document.createElement("li");
        li.className = "song-item";
        li.innerHTML = `
            <div class="song-item-info">
                <img src="${song.cover}" alt="" class="song-thumb" onerror="this.src='https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100'">
                <div>
                    <strong>${escapeHtml(song.title)}</strong>
                    <small>${escapeHtml(song.artist)}</small>
                </div>
            </div>
        `;
        li.querySelector(".song-item-info").addEventListener("click", () => {
            const idx = playlist.findIndex(s => s.videoId === song.videoId);
            if (idx !== -1) {
                loadSong(idx);
            } else {
                StorageManager.addSongToPlaylist(activePlaylistId, song);
                loadActivePlaylist();
                const newIdx = playlist.findIndex(s => s.videoId === song.videoId);
                renderPlaylist();
                if (newIdx !== -1) loadSong(newIdx);
            }
        });
        list.appendChild(li);
    });
}

function renderAll() {
    renderSidebarPlaylists();
    renderPlaylist();
    renderFavorites();
    renderRecentSongs();
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
