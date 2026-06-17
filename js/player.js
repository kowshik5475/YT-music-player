// player.js

let player;

let shuffleMode = false;

let repeatMode = "off";

function onYouTubeIframeAPIReady() {

    player = new YT.Player(
        "player",
        {

        height: "0",
        width: "0",

        videoId:
        playlist[currentIndex]
        .videoId,

        playerVars: {
            autoplay: 0
        },

        events: {

            onReady:
            onPlayerReady,

            onStateChange:
            onPlayerStateChange
        }

    });
}

function onPlayerReady() {

    renderPlaylist();

    renderFavorites();

    renderRecentSongs();

    updateSongUI();

    player.setVolume(50);

    setInterval(
        updateProgressBar,
        1000
    );
}

function onPlayerStateChange(
    event
) {

    if (
        event.data ===
        YT.PlayerState.ENDED
    ) {

        if (
            repeatMode === "one"
        ) {

            player.playVideo();

        } else {

            nextSong();

        }
    }
}

function updateSongUI() {

    const song =
        playlist[currentIndex];

    document
        .getElementById(
            "songTitle"
        )
        .textContent =
        song.title;

    document
        .getElementById(
            "artistName"
        )
        .textContent =
        song.artist;

    document
        .getElementById(
            "coverImage"
        )
        .src =
        song.cover;
}

function loadSong(index) {

    currentIndex = index;

    const song =
        playlist[currentIndex];

    player.loadVideoById(
        song.videoId
    );

    updateSongUI();

    StorageManager
        .saveRecentSong(song);

    renderRecentSongs();
}

function nextSong() {

    if (shuffleMode) {

        currentIndex =
        Math.floor(
            Math.random()
            *
            playlist.length
        );

    } else {

        currentIndex =
        (currentIndex + 1)
        %
        playlist.length;
    }

    loadSong(
        currentIndex
    );
}

function previousSong() {

    currentIndex--;

    if (
        currentIndex < 0
    ) {

        currentIndex =
        playlist.length - 1;
    }

    loadSong(
        currentIndex
    );
}

function togglePlay() {

    const state =
        player.getPlayerState();

    const btn =
        document
        .getElementById(
            "playBtn"
        );

    if (
        state ===
        YT.PlayerState.PLAYING
    ) {

        player.pauseVideo();

        btn.innerHTML =
        '<i class="fa-solid fa-play"></i>';

    } else {

        player.playVideo();

        btn.innerHTML =
        '<i class="fa-solid fa-pause"></i>';
    }
}

function updateProgressBar() {

    if (
        !player ||
        !player.getDuration
    ) return;

    const duration =
        player.getDuration();

    const current =
        player.getCurrentTime();

    if (duration > 0) {

        const progress =
        (
            current /
            duration
        ) * 100;

        document
        .getElementById(
            "progressBar"
        )
        .value =
        progress;

        document
        .getElementById(
            "currentTime"
        )
        .textContent =
        formatTime(current);

        document
        .getElementById(
            "duration"
        )
        .textContent =
        formatTime(duration);
    }
}

function formatTime(seconds){

    const mins =
        Math.floor(seconds / 60);

    const secs =
        Math.floor(seconds % 60);

    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

document.addEventListener(
"keydown",
event => {

if (
event.code === "Space"
){

event.preventDefault();

togglePlay();

}

if (
event.key ===
"ArrowRight"
){

nextSong();

}

if (
event.key ===
"ArrowLeft"
){

previousSong();

}
});

document
.getElementById(
"progressBar"
)
.addEventListener(
"input",
function(){

const seekTime =
(
this.value
/
100
)
*
player.getDuration();

player.seekTo(
seekTime,
true
);

}
);

document
.getElementById(
"volumeSlider"
)
.addEventListener(
"input",
function(){

player.setVolume(
this.value
);

}
);