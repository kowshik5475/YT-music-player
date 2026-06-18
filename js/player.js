// player.js

let player;
let shuffleMode = StorageManager.getShuffleMode();
let repeatMode = StorageManager.getRepeatMode();

function onYouTubeIframeAPIReady() {
    loadActivePlaylist();
    if (!playlist.length) return;

    player = new YT.Player("player", {
        height: "0",
        width: "0",
        videoId: playlist[currentIndex].videoId,
        playerVars: { autoplay: 0 },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
}

function onPlayerReady() {
    renderAll();
    updateSongUI();
    player.setVolume(50);
    setInterval(updateProgressBar, 1000);
    syncToggleStates();
}

function onPlayerStateChange(event) {
    const btn = document.getElementById("playBtn");
    if (event.data === YT.PlayerState.PLAYING) {
        btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        if (event.data !== YT.PlayerState.ENDED) {
            btn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    }
    if (event.data === YT.PlayerState.ENDED) {
        if (repeatMode === "one") {
            player.playVideo();
        } else {
            nextSong();
        }
    }
}

function onPlaylistSwitch() {
    if (!playlist.length) return;
    if (player && player.loadVideoById) {
        player.loadVideoById(playlist[0].videoId);
        player.stopVideo();
    }
    currentIndex = 0;
    updateSongUI();
    renderPlaylist();
}

function updateSongUI() {
    if (!playlist.length) return;
    const song = playlist[currentIndex];
    document.getElementById("songTitle").textContent = song.title;
    document.getElementById("artistName").textContent = song.artist;
    const cover = document.getElementById("coverImage");
    cover.src = song.cover;
    cover.onerror = () => {
        cover.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800";
    };
    if (typeof updateFavoriteButton === "function") updateFavoriteButton();
    document.title = `${song.title} — YT Music`;

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
        let next;
        do { next = Math.floor(Math.random() * playlist.length); } while (playlist.length > 1 && next === currentIndex);
        currentIndex = next;
    } else {
        currentIndex = (currentIndex + 1) % playlist.length;
        if (repeatMode === "all" && currentIndex === 0) {
            // wrap around is fine
        }
    }
    loadSong(currentIndex);
}

function previousSong() {
    if (!playlist.length) return;
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    loadSong(currentIndex);
}

function togglePlay() {
    if (!player) return;
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

function updateProgressBar() {
    if (!player || !player.getDuration) return;
    const duration = player.getDuration();
    const current = player.getCurrentTime();
    if (duration > 0) {
        document.getElementById("progressBar").value = (current / duration) * 100;
        document.getElementById("currentTime").textContent = formatTime(current);
        document.getElementById("duration").textContent = formatTime(duration);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function syncToggleStates() {
    const shuffleBtn = document.getElementById("shuffleBtn");
    const repeatBtn = document.getElementById("repeatBtn");

    if (shuffleBtn) {
        shuffleBtn.classList.toggle("active-toggle", shuffleMode);
    }

    if (repeatBtn) {
        repeatBtn.classList.remove("active-toggle");
        if (repeatMode === "off") {
            repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
        } else if (repeatMode === "one") {
            repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i><span class="repeat-badge">1</span>';
            repeatBtn.classList.add("active-toggle");
        } else {
            repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
            repeatBtn.classList.add("active-toggle");
        }
        repeatBtn.title = repeatMode === "off" ? "Repeat: Off" : repeatMode === "one" ? "Repeat: One" : "Repeat: All";
    }
}

document.addEventListener("keydown", event => {
    const tag = document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
    }
    if (event.key === "ArrowRight") nextSong();
    if (event.key === "ArrowLeft") previousSong();
});

document.getElementById("progressBar").addEventListener("input", function () {
    if (!player || !player.getDuration) return;
    player.seekTo((this.value / 100) * player.getDuration(), true);
});

document.getElementById("volumeSlider").addEventListener("input", function () {
    if (player) player.setVolume(this.value);
    const icon = document.querySelector(".volume-wrapper .fa-volume-high, .volume-wrapper .fa-volume-low, .volume-wrapper .fa-volume-xmark");
    if (!icon) return;
    const vol = parseInt(this.value);
    if (vol === 0) {
        icon.className = "fa-solid fa-volume-xmark";
    } else if (vol < 50) {
        icon.className = "fa-solid fa-volume-low";
    } else {
        icon.className = "fa-solid fa-volume-high";
    }
});
