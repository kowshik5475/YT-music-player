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
                input.placeholder = "Search library...";
                closeSearchResults();
                filterLocalLibrary("");
            }
        });
    }

    if (!input) return;

    let debounceTimer;
    input.addEventListener("keyup", (e) => {
        clearTimeout(debounceTimer);
        const query = input.value.trim();
        if (searchType === "local") {
            filterLocalLibrary(query);
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
            filterLocalLibrary("");
        }
    });
}

function filterLocalLibrary(query) {
    closeSearchResults();
    // Filter library list
    const items = document.querySelectorAll("#libraryList .song-item");
    const q = query.toLowerCase();
    items.forEach(li => {
        const text = li.textContent.toLowerCase();
        li.style.display = (!q || text.includes(q)) ? "" : "none";
    });
    // Also filter playlist detail songs if open
    document.querySelectorAll(".pl-detail-songs .song-item").forEach(li => {
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
            <img src="${song.cover}" alt="" class="song-thumb" loading="lazy" decoding="async" onerror="this.src='https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&q=60'">
            <div class="search-result-info">
                <strong>${escapeHtml(song.title)}</strong>
                <small>${escapeHtml(song.artist)}</small>
            </div>
            <div class="search-result-actions">
                <button class="play-now-btn" title="Add to library & play"><i class="fa-solid fa-play"></i></button>
                <button class="add-to-pl-btn" title="Add to library"><i class="fa-solid fa-plus"></i></button>
            </div>
        `;

        // Play now: add to library, add to active playlist, play
        li.querySelector(".play-now-btn").addEventListener("click", () => {
            StorageManager.addToLibrary(song);
            StorageManager.addSongToPlaylist(activePlaylistId, song.videoId);
            loadActivePlaylist();
            const idx = playlist.findIndex(s => s.videoId === song.videoId);
            renderAll();
            if (idx !== -1) loadSong(idx);
        });

        // Add to library only
        li.querySelector(".add-to-pl-btn").addEventListener("click", (e) => {
            const btn = e.currentTarget;
            StorageManager.addToLibrary(song);
            StorageManager.addSongToPlaylist(activePlaylistId, song.videoId);
            loadActivePlaylist();
            renderAll();
            btn.innerHTML = '<i class="fa-solid fa-check"></i>';
            btn.style.background = "#22c55e";
            btn.style.borderColor = "#22c55e";
            btn.title = "Added!";
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-solid fa-plus"></i>';
                btn.style.background = "";
                btn.style.borderColor = "";
                btn.title = "Add to library";
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
