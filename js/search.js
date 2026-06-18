// search.js

function initializeSearch() {
    const input = document.getElementById("searchInput");
    const searchTypeToggle = document.getElementById("searchTypeToggle");
    let searchType = "local";

    if (searchTypeToggle) {
        searchTypeToggle.addEventListener("click", () => {
            searchType = searchType === "local" ? "youtube" : "local";
            if (searchType === "youtube") {
                searchTypeToggle.classList.add("yt-mode");
                searchTypeToggle.title = "Switch to local search";
                input.placeholder = "Search YouTube... (press Enter)";
            } else {
                searchTypeToggle.classList.remove("yt-mode");
                searchTypeToggle.title = "Switch to YouTube search";
                input.placeholder = "Search playlist...";
                closeSearchResults();
                filterLocalPlaylist("");
            }
        });
    }

    if (!input) return;

    let debounceTimer;
    input.addEventListener("keyup", (e) => {
        clearTimeout(debounceTimer);
        const query = input.value.trim();

        if (searchType === "local") {
            filterLocalPlaylist(query);
        } else {
            if (e.key === "Enter" && query.length > 1) {
                runYouTubeSearch(query);
            } else if (query.length === 0) {
                closeSearchResults();
            } else {
                debounceTimer = setTimeout(() => {
                    if (query.length > 2) runYouTubeSearch(query);
                }, 800);
            }
        }
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            input.value = "";
            closeSearchResults();
            filterLocalPlaylist("");
        }
    });
}

function filterLocalPlaylist(query) {
    closeSearchResults();
    const items = document.querySelectorAll("#playlist .song-item");
    const q = query.toLowerCase();
    items.forEach(li => {
        const text = li.textContent.toLowerCase();
        li.style.display = (!q || text.includes(q)) ? "" : "none";
    });
}

async function runYouTubeSearch(query) {
    const panel = getOrCreateSearchPanel();
    panel.innerHTML = `<div class="search-loading"><i class="fa-solid fa-spinner fa-spin"></i> Searching YouTube...</div>`;
    panel.style.display = "block";

    const results = await searchYouTube(query);
    renderSearchResults(results, panel);
}

function renderSearchResults(results, panel) {
    if (!results || !results.length) {
        panel.innerHTML = '<div class="search-empty">No results found. Try another search.</div>';
        return;
    }
    panel.innerHTML = `
        <div class="search-results-header">
            <span><i class="fa-brands fa-youtube"></i> YouTube Results</span>
            <button id="closeSearchBtn"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `;
    document.getElementById("closeSearchBtn").addEventListener("click", () => {
        closeSearchResults();
        document.getElementById("searchInput").value = "";
    });

    const list = document.createElement("ul");
    list.className = "search-results-list";
    results.forEach(song => {
        const li = document.createElement("li");
        li.className = "search-result-item";
        li.innerHTML = `
            <img src="${song.cover}" alt="" class="song-thumb" onerror="this.src='https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100'">
            <div class="search-result-info">
                <strong>${escapeHtml(song.title)}</strong>
                <small>${escapeHtml(song.artist)}</small>
            </div>
            <div class="search-result-actions">
                <button class="play-now-btn" title="Play now"><i class="fa-solid fa-play"></i></button>
                <button class="add-to-pl-btn" title="Add to playlist"><i class="fa-solid fa-plus"></i></button>
            </div>
        `;
        li.querySelector(".play-now-btn").addEventListener("click", () => {
            StorageManager.addSongToPlaylist(activePlaylistId, song);
            loadActivePlaylist();
            const idx = playlist.findIndex(s => s.videoId === song.videoId);
            renderPlaylist();
            if (idx !== -1) loadSong(idx);
        });
        li.querySelector(".add-to-pl-btn").addEventListener("click", (e) => {
            const btn = e.currentTarget;
            const added = StorageManager.addSongToPlaylist(activePlaylistId, song);
            loadActivePlaylist();
            renderPlaylist();
            btn.innerHTML = '<i class="fa-solid fa-check"></i>';
            btn.style.background = "#22c55e";
            btn.title = added ? "Added!" : "Already in playlist";
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-solid fa-plus"></i>';
                btn.style.background = "";
            }, 1500);
        });
        list.appendChild(li);
    });
    panel.appendChild(list);
}

function getOrCreateSearchPanel() {
    let panel = document.getElementById("searchResultsPanel");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "searchResultsPanel";
        document.querySelector(".search-box").appendChild(panel);
    }
    return panel;
}

function closeSearchResults() {
    const panel = document.getElementById("searchResultsPanel");
    if (panel) panel.style.display = "none";
}
