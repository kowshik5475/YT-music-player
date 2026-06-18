// playlist.js

// ── Active playlist state (player reads these) ──────────────────────────────
let activePlaylistId = StorageManager.getActivePlaylistId();
let playlist         = StorageManager.getPlaylistSongs(activePlaylistId);
let currentIndex     = 0;

// ── Sidebar navigation state ─────────────────────────────────────────────────
// tab: "playlists" | "songs" | "favorites" | "recent"
// plMode: "list" | "detail"   (Playlists tab sub-view)
// detailId: playlist ID being viewed in detail mode
let _plMode    = "list";
let _detailId  = null;

// ── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function loadActivePlaylist() {
    activePlaylistId = StorageManager.getActivePlaylistId();
    playlist         = StorageManager.getPlaylistSongs(activePlaylistId);
    currentIndex     = 0;
}

// ── PLAYLISTS TAB ─────────────────────────────────────────────────────────────

function renderSidebarPlaylists() {
    if (_plMode === "detail" && _detailId) {
        renderPlaylistDetail(_detailId);
    } else {
        renderPlaylistList();
    }
}

/* Grid of playlist cards */
function renderPlaylistList() {
    const container = document.getElementById("playlistsNav");
    if (!container) return;
    const pls   = StorageManager.getPlaylists();
    const actId = StorageManager.getActivePlaylistId();
    container.innerHTML = "";

    const cards = document.createElement("div");
    cards.className = "pl-cards";

    Object.values(pls).forEach(pl => {
        const songs   = StorageManager.getPlaylistSongs(pl.id);
        const cover   = songs.length ? songs[0].cover
                       : "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400";
        const isActive = pl.id === actId;

        const card = document.createElement("div");
        card.className = "pl-card" + (isActive ? " active" : "");
        card.innerHTML = `
            <div class="pl-card-cover" style="background-image:url('${cover}')">
                <div class="pl-card-overlay">
                    <button class="pl-play-btn" title="Play playlist" data-id="${pl.id}">
                        <i class="fa-solid fa-play"></i>
                    </button>
                </div>
            </div>
            <div class="pl-card-info">
                <div class="pl-card-name" title="${escapeHtml(pl.name)}">${escapeHtml(pl.name)}</div>
                <div class="pl-card-meta">${songs.length} song${songs.length !== 1 ? "s" : ""}
                    ${pl.description ? `· <span class="pl-card-desc">${escapeHtml(pl.description)}</span>` : ""}
                </div>
            </div>
            <div class="pl-card-actions">
                <button class="pl-view-btn" title="View songs" data-id="${pl.id}"><i class="fa-solid fa-chevron-right"></i></button>
                ${pl.id !== DEFAULT_PLAYLIST_ID ? `<button class="pl-del-btn" title="Delete" data-id="${pl.id}"><i class="fa-solid fa-trash"></i></button>` : ""}
            </div>
        `;

        // Play playlist
        card.querySelector(".pl-play-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            switchPlaylist(pl.id);
        });

        // Drill into detail
        card.querySelector(".pl-view-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            openPlaylistDetail(pl.id);
        });
        card.querySelector(".pl-card-cover").addEventListener("click", () => openPlaylistDetail(pl.id));
        card.querySelector(".pl-card-info").addEventListener("click", () => openPlaylistDetail(pl.id));

        // Delete
        const delBtn = card.querySelector(".pl-del-btn");
        if (delBtn) {
            delBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (!confirm(`Delete "${pl.name}"? This won't remove songs from your library.`)) return;
                StorageManager.deletePlaylist(pl.id);
                loadActivePlaylist();
                renderAll();
                if (typeof onPlaylistSwitch === "function") onPlaylistSwitch();
            });
        }

        cards.appendChild(card);
    });

    container.appendChild(cards);
}

/* Drill-down: single playlist detail */
function openPlaylistDetail(id) {
    _plMode   = "detail";
    _detailId = id;
    renderPlaylistDetail(id);
    // Also activate the Playlists tab visually
    activateSidebarTab("playlists");
}

function renderPlaylistDetail(id) {
    const container = document.getElementById("playlistsNav");
    if (!container) return;
    const pls = StorageManager.getPlaylists();
    const pl  = pls[id];
    if (!pl) { _plMode = "list"; renderPlaylistList(); return; }

    const songs   = StorageManager.getPlaylistSongs(id);
    const isActive = StorageManager.getActivePlaylistId() === id;

    container.innerHTML = "";

    // Back bar
    const back = document.createElement("div");
    back.className = "pl-detail-back";
    back.innerHTML = `<button id="plBackBtn"><i class="fa-solid fa-arrow-left"></i> All Playlists</button>`;
    back.querySelector("#plBackBtn").addEventListener("click", () => {
        _plMode = "list"; _detailId = null;
        renderPlaylistList();
    });
    container.appendChild(back);

    // Detail header
    const header = document.createElement("div");
    header.className = "pl-detail-header";
    const coverSrc = songs.length ? songs[0].cover
                   : "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400";
    header.innerHTML = `
        <div class="pl-detail-cover" style="background-image:url('${coverSrc}')"></div>
        <div class="pl-detail-meta">
            <div class="pl-detail-name">${escapeHtml(pl.name)}</div>
            ${pl.description ? `<div class="pl-detail-desc">${escapeHtml(pl.description)}</div>` : ""}
            <div class="pl-detail-count">${songs.length} song${songs.length !== 1 ? "s" : ""}</div>
            <div class="pl-detail-btns">
                <button class="pl-detail-play ${isActive ? "is-active" : ""}" id="detailPlayBtn">
                    <i class="fa-solid fa-play"></i> ${isActive ? "Playing" : "Play All"}
                </button>
                ${pl.id !== DEFAULT_PLAYLIST_ID ? `<button class="pl-detail-rename" id="detailRenameBtn" title="Rename"><i class="fa-solid fa-pen"></i></button>` : ""}
            </div>
        </div>
    `;

    header.querySelector("#detailPlayBtn").addEventListener("click", () => {
        switchPlaylist(id);
        renderPlaylistDetail(id); // refresh "Playing" badge
    });

    const renameBtn = header.querySelector("#detailRenameBtn");
    if (renameBtn) {
        renameBtn.addEventListener("click", () => {
            const newName = prompt("Rename playlist:", pl.name);
            if (!newName || !newName.trim()) return;
            StorageManager.renamePlaylist(id, newName.trim());
            renderPlaylistDetail(id);
        });
    }
    container.appendChild(header);

    // Song list
    if (!songs.length) {
        const empty = document.createElement("div");
        empty.className = "empty-msg";
        empty.textContent = "No songs yet. Browse the Library tab and add some!";
        container.appendChild(empty);
    } else {
        const ul = document.createElement("ul");
        ul.className = "pl-detail-songs";
        songs.forEach((song, idx) => {
            const li = document.createElement("li");
            li.className = "song-item" + (isActive && idx === currentIndex ? " active-song" : "");
            li.innerHTML = `
                <div class="song-item-info" data-index="${idx}">
                    <img src="${song.cover}" alt="" class="song-thumb" onerror="this.src='https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100'">
                    <div>
                        <strong>${escapeHtml(song.title)}</strong>
                        <small>${escapeHtml(song.artist)}</small>
                    </div>
                </div>
                <button class="remove-song-btn" title="Remove from playlist" data-videoid="${song.videoId}">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            li.querySelector(".song-item-info").addEventListener("click", () => {
                if (!isActive) switchPlaylist(id);
                const freshIdx = StorageManager.getPlaylistSongs(id).findIndex(s => s.videoId === song.videoId);
                if (freshIdx !== -1) loadSong(freshIdx);
                renderPlaylistDetail(id);
            });
            li.querySelector(".remove-song-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                StorageManager.removeSongFromPlaylist(id, song.videoId);
                if (isActive) {
                    loadActivePlaylist();
                    if (typeof onPlaylistSwitch === "function") onPlaylistSwitch();
                }
                renderPlaylistDetail(id);
            });
            ul.appendChild(li);
        });
        container.appendChild(ul);
    }
}

// ── SONGS TAB (Library) ───────────────────────────────────────────────────────

function renderLibrary() {
    const el = document.getElementById("libraryList");
    if (!el) return;
    const songs = StorageManager.getLibrarySongs();

    el.innerHTML = "";
    if (!songs.length) {
        el.innerHTML = '<li class="empty-msg">Your library is empty.<br>Search YouTube to add songs!</li>';
        return;
    }

    songs.forEach(song => {
        const li = document.createElement("li");
        li.className = "song-item";
        li.innerHTML = `
            <div class="song-item-info lib-play" data-videoid="${song.videoId}">
                <img src="${song.cover}" alt="" class="song-thumb" onerror="this.src='https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100'">
                <div>
                    <strong>${escapeHtml(song.title)}</strong>
                    <small>${escapeHtml(song.artist)}</small>
                </div>
            </div>
            <div class="lib-actions">
                <button class="lib-add-btn icon-action-btn" title="Add to playlist" data-videoid="${song.videoId}">
                    <i class="fa-solid fa-list-ul"></i>
                </button>
                <button class="remove-song-btn lib-del" title="Remove from library" data-videoid="${song.videoId}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

        // Play from library (add to active playlist if not there, then play)
        li.querySelector(".lib-play").addEventListener("click", () => {
            const actId = StorageManager.getActivePlaylistId();
            StorageManager.addSongToPlaylist(actId, song.videoId);
            loadActivePlaylist();
            const idx = playlist.findIndex(s => s.videoId === song.videoId);
            if (idx !== -1) loadSong(idx);
            renderAll();
        });

        // Add to playlist dropdown
        li.querySelector(".lib-add-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            showAddToPlaylistMenu(e.currentTarget, song.videoId);
        });

        // Remove from library
        li.querySelector(".lib-del").addEventListener("click", (e) => {
            e.stopPropagation();
            if (!confirm(`Remove "${song.title}" from your library? It will also be removed from all playlists.`)) return;
            StorageManager.removeFromLibrary(song.videoId);
            loadActivePlaylist();
            renderAll();
            if (typeof onPlaylistSwitch === "function") onPlaylistSwitch();
        });

        el.appendChild(li);
    });
}

/* Small popup menu listing playlists */
function showAddToPlaylistMenu(anchor, videoId) {
    // Remove any existing menu
    document.querySelectorAll(".pl-pick-menu").forEach(m => m.remove());

    const pls = StorageManager.getPlaylists();
    const menu = document.createElement("div");
    menu.className = "pl-pick-menu";

    Object.values(pls).forEach(pl => {
        const inPl = StorageManager.isSongInPlaylist(pl.id, videoId);
        const row  = document.createElement("button");
        row.className = "pl-pick-row" + (inPl ? " already-in" : "");
        row.innerHTML = `<i class="fa-solid fa-${inPl ? "check" : "plus"}"></i> ${escapeHtml(pl.name)}`;
        row.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!inPl) {
                StorageManager.addSongToPlaylist(pl.id, videoId);
                row.className = "pl-pick-row already-in";
                row.innerHTML = `<i class="fa-solid fa-check"></i> ${escapeHtml(pl.name)}`;
                if (pl.id === StorageManager.getActivePlaylistId()) {
                    loadActivePlaylist();
                    if (_plMode === "detail") renderPlaylistDetail(_detailId);
                }
            }
            setTimeout(() => menu.remove(), 600);
        });
        menu.appendChild(row);
    });

    // Position near the button
    document.body.appendChild(menu);
    const rect = anchor.getBoundingClientRect();
    menu.style.top  = (rect.bottom + window.scrollY + 4) + "px";
    menu.style.left = (rect.left + window.scrollX - menu.offsetWidth + anchor.offsetWidth) + "px";

    // Close on outside click
    const close = (e) => { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener("click", close); } };
    setTimeout(() => document.addEventListener("click", close), 0);
}

// ── FAVORITES & RECENT ────────────────────────────────────────────────────────

function renderFavorites() {
    const list = document.getElementById("favoritesList");
    if (!list) return;
    list.innerHTML = "";
    const favs = StorageManager.getFavorites();
    if (!favs.length) { list.innerHTML = '<li class="empty-msg">No favorites yet.<br>♥ a song while it plays!</li>'; return; }
    favs.forEach(song => {
        const li = document.createElement("li");
        li.className = "song-item";
        li.innerHTML = `
            <div class="song-item-info">
                <img src="${song.cover}" alt="" class="song-thumb" onerror="this.src='https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100'">
                <div><strong>${escapeHtml(song.title)}</strong><small>${escapeHtml(song.artist)}</small></div>
            </div>
            <button class="remove-song-btn fav-remove" title="Remove from favorites"><i class="fa-solid fa-heart-crack"></i></button>
        `;
        li.querySelector(".song-item-info").addEventListener("click", () => {
            const actId = StorageManager.getActivePlaylistId();
            StorageManager.addSongToPlaylist(actId, song.videoId);
            loadActivePlaylist();
            const idx = playlist.findIndex(s => s.videoId === song.videoId);
            renderAll();
            if (idx !== -1) loadSong(idx);
        });
        li.querySelector(".fav-remove").addEventListener("click", (e) => {
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
    if (!recent.length) { list.innerHTML = '<li class="empty-msg">Nothing played yet.</li>'; return; }
    recent.forEach(song => {
        const li = document.createElement("li");
        li.className = "song-item";
        li.innerHTML = `
            <div class="song-item-info">
                <img src="${song.cover}" alt="" class="song-thumb" onerror="this.src='https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100'">
                <div><strong>${escapeHtml(song.title)}</strong><small>${escapeHtml(song.artist)}</small></div>
            </div>
        `;
        li.querySelector(".song-item-info").addEventListener("click", () => {
            const actId = StorageManager.getActivePlaylistId();
            StorageManager.addSongToPlaylist(actId, song.videoId);
            loadActivePlaylist();
            const idx = playlist.findIndex(s => s.videoId === song.videoId);
            renderAll();
            if (idx !== -1) loadSong(idx);
        });
        list.appendChild(li);
    });
}

// ── SWITCH PLAYLIST (player context) ─────────────────────────────────────────

function switchPlaylist(id) {
    StorageManager.setActivePlaylistId(id);
    activePlaylistId = id;
    loadActivePlaylist();
    renderAll();
    if (typeof onPlaylistSwitch === "function") onPlaylistSwitch();
}

// ── RENDER ALL ────────────────────────────────────────────────────────────────

function renderAll() {
    renderSidebarPlaylists();
    renderLibrary();
    renderFavorites();
    renderRecentSongs();
    updateLibraryCount();
}

function updateLibraryCount() {
    const badge = document.getElementById("libCountBadge");
    if (badge) badge.textContent = StorageManager.getLibrarySongs().length;
}
