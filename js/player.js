// player.js

let player;
let shuffleMode = StorageManager.getShuffleMode();
let repeatMode  = StorageManager.getRepeatMode();

window.onYouTubeIframeAPIReady = function ()  {
    console.log("YouTube API Ready");
    // playlist is already initialised in playlist.js at parse time
    if (!playlist.length) {
        // fallback: try to reload from storage in case something went wrong
        loadActivePlaylist?.();
    }
    console.log("Playlist length:", playlist.length);
    if (!playlist.length) {
        console.error("No songs found in playlist");
        return;
    }
 // genuinely empty — nothing to play

    
        player = new YT.Player("player", {
            height: "200",
            width: "200",
            videoId: playlist[currentIndex].videoId,
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                rel: 0,
                origin: window.location.origin
            },
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
                onError: onPlayerError
            }
        });
    }; 


function onPlayerReady() {
    renderAll();
    updateSongUI();
    player.setVolume(50);
    setInterval(updateProgressBar, 500);
    syncToggleStates();
}

function onPlayerStateChange(event) {
    const btn = document.getElementById("playBtn");
    if (!btn) return;

    switch (event.data) {
        case YT.PlayerState.PLAYING:
            btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            break;
        case YT.PlayerState.PAUSED:
        case YT.PlayerState.CUED:
            btn.innerHTML = '<i class="fa-solid fa-play"></i>';
            break;
        case YT.PlayerState.ENDED:
            btn.innerHTML = '<i class="fa-solid fa-play"></i>';
            if (repeatMode === "one") {
                player.playVideo();
            } else {
                nextSong();
            }
            break;
    }
}

function onPlayerError(event) {
    console.warn("YouTube player error:", event.data);
    // Try the next song on unplayable video
    if ([2, 5, 100, 101, 150].includes(event.data)) {
        setTimeout(nextSong, 800);
    }
}

function onPlaylistSwitch() {
    if (!playlist.length) {
        document.getElementById("songTitle").textContent = "No songs";
        document.getElementById("artistName").textContent = "";
        return;
    }
    currentIndex = 0;
    if (player && player.cueVideoById) {
        player.cueVideoById(playlist[0].videoId);
    }
    updateSongUI();
    renderAll();
    const btn = document.getElementById("playBtn");
    if (btn) btn.innerHTML = '<i class="fa-solid fa-play"></i>';
}

function updateSongUI() {
    if (!playlist.length) return;
    const song = playlist[currentIndex];
    document.getElementById("songTitle").textContent = song.title;
    document.getElementById("artistName").textContent = song.artist;
    const cover = document.getElementById("coverImage");
    // Upscale Unsplash thumbnails for the player card display
    cover.src = (song.cover || "").replace(/([?&]w=)\d+/, "$1400").replace(/([?&]q=)\d+/, "$180");
    cover.onerror = () => {
        cover.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80";
    };
    document.title = song.title + " — YT Music";
    if (typeof updateFavoriteButton === "function") updateFavoriteButton();

    // Highlight active song in sidebar
    document.querySelectorAll("#playlist .song-item").forEach((li, i) => {
        li.classList.toggle("active-song", i === currentIndex);
    });
}

function loadSong(index) {
    if (!playlist.length) return;
    currentIndex = index;
    const song = playlist[currentIndex];
    if (player && player.loadVideoById) {
        player.loadVideoById(song.videoId);
    }
    updateSongUI();
    StorageManager.saveRecentSong(song);
    renderRecentSongs();
}

function nextSong() {
    if (!playlist.length) return;
    if (shuffleMode) {
        let next = currentIndex;
        if (playlist.length > 1) {
            while (next === currentIndex) {
                next = Math.floor(Math.random() * playlist.length);
            }
        }
        currentIndex = next;
    } else {
        currentIndex = (currentIndex + 1) % playlist.length;
    }
    loadSong(currentIndex);
}

function previousSong() {
    if (!playlist.length) return;
    // If more than 3 s into the song, restart it; otherwise go back
    if (player && player.getCurrentTime && player.getCurrentTime() > 3) {
        player.seekTo(0, true);
        return;
    }
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    loadSong(currentIndex);
}

function togglePlay() {

    console.log("Play button clicked");

    if (!player) {
        console.error("Player not initialized");
        return;
    }

    const state = player.getPlayerState();

    console.log("Current state:", state);

    if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

function updateProgressBar() {
    if (!player || typeof player.getDuration !== "function") return;
    const duration = player.getDuration();
    const current  = player.getCurrentTime();
    if (duration > 0) {
        document.getElementById("progressBar").value =
            (current / duration) * 100;
        document.getElementById("currentTime").textContent =
            formatTime(current);
        document.getElementById("duration").textContent =
            formatTime(duration);
    }
}

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ":" + (sec < 10 ? "0" : "") + sec;
}

function syncToggleStates() {
    const shuffleBtn = document.getElementById("shuffleBtn");
    const repeatBtn  = document.getElementById("repeatBtn");

    if (shuffleBtn) {
        shuffleBtn.classList.toggle("active-toggle", shuffleMode);
        shuffleBtn.title = shuffleMode ? "Shuffle: On" : "Shuffle: Off";
    }

    if (repeatBtn) {
        repeatBtn.classList.remove("active-toggle");
        if (repeatMode === "off") {
            repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
            repeatBtn.title = "Repeat: Off";
        } else if (repeatMode === "one") {
            repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i><span class="repeat-badge">1</span>';
            repeatBtn.classList.add("active-toggle");
            repeatBtn.title = "Repeat: One";
        } else {
            repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
            repeatBtn.classList.add("active-toggle");
            repeatBtn.title = "Repeat: All";
        }
    }
}

// ── Keyboard shortcuts ─────────────────────────────────────────────────────
document.addEventListener("keydown", e => {
    const tag = document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.code === "Space")      { e.preventDefault(); togglePlay(); }
    if (e.key  === "ArrowRight") nextSong();
    if (e.key  === "ArrowLeft")  previousSong();
});

// ── Progress bar ───────────────────────────────────────────────────────────
document.getElementById("progressBar").addEventListener("input", function () {
    if (!player || typeof player.getDuration !== "function") return;
    player.seekTo((this.value / 100) * player.getDuration(), true);
});

// ── Volume ─────────────────────────────────────────────────────────────────
document.getElementById("volumeSlider").addEventListener("input", function () {
    if (player) player.setVolume(Number(this.value));
    const volIcon = document.querySelector(".volume-wrapper i");
    if (!volIcon) return;
    const v = Number(this.value);
    volIcon.className = v === 0
        ? "fa-solid fa-volume-xmark"
        : v < 50
            ? "fa-solid fa-volume-low"
            : "fa-solid fa-volume-high";
});
