// app.js

window.addEventListener(
    "load",
    () => {

        initializeTheme();

        initializeSearch();

        initializeButtons();
    }
);

function initializeTheme() {

    const theme =
        StorageManager.getTheme();

    if (theme === "light") {

        document.body
            .classList.add(
                "light"
            );
    }
}

function initializeButtons() {

    const playBtn =
        document.getElementById(
            "playBtn"
        );

    const nextBtn =
        document.getElementById(
            "nextBtn"
        );

    const prevBtn =
        document.getElementById(
            "prevBtn"
        );

    const shuffleBtn =
        document.getElementById(
            "shuffleBtn"
        );

    const repeatBtn =
        document.getElementById(
            "repeatBtn"
        );

    const favoriteBtn =
        document.getElementById(
            "favoriteBtn"
        );

    const themeBtn =
        document.getElementById(
            "themeBtn"
        );

    playBtn.addEventListener(
        "click",
        togglePlay
    );

    nextBtn.addEventListener(
        "click",
        nextSong
    );

    prevBtn.addEventListener(
        "click",
        previousSong
    );

    shuffleBtn.addEventListener(
        "click",
        () => {

            shuffleMode =
                !shuffleMode;

            shuffleBtn.style.opacity =
                shuffleMode
                    ? "1"
                    : ".5";
        }
    );

    repeatBtn.addEventListener(
        "click",
        () => {

            if (
                repeatMode ===
                "off"
            ) {

                repeatMode =
                    "one";

                repeatBtn.innerHTML =
                    '<i class="fa-solid fa-repeat"></i> 1';

            }
            else if (
                repeatMode ===
                "one"
            ) {

                repeatMode =
                    "all";

                repeatBtn.innerHTML =
                    '<i class="fa-solid fa-repeat"></i> All';

            }
            else {

                repeatMode =
                    "off";

                repeatBtn.innerHTML =
                    '<i class="fa-solid fa-repeat"></i>';
            }
        }
    );

    favoriteBtn.addEventListener(
        "click",
        toggleFavorite
    );

    themeBtn.addEventListener(
        "click",
        toggleTheme
    );
}

function toggleFavorite() {

    const song =
        playlist[currentIndex];

    if (
        StorageManager
            .isFavorite(
                song.videoId
            )
    ) {

        StorageManager
            .removeFavorite(
                song.videoId
            );

    } else {

        StorageManager
            .addFavorite(
                song
            );
    }

    renderFavorites();

    updateFavoriteButton();
}

function updateFavoriteButton() {

    const song =
        playlist[currentIndex];

    const btn =
        document.getElementById(
            "favoriteBtn"
        );

    const icon =
        btn.querySelector("i");

    if (
        StorageManager
            .isFavorite(
                song.videoId
            )
    ) {

        icon.className =
            "fa-solid fa-heart";

        btn.style.background =
            "#ef4444";

    } else {

        icon.className =
            "fa-regular fa-heart";

        btn.style.background =
            "var(--accent)";
    }
}

function toggleTheme() {

    document.body
        .classList.toggle(
            "light"
        );

    const currentTheme =
        document.body
            .classList.contains(
                "light"
            )
            ? "light"
            : "dark";

    StorageManager
        .saveTheme(
            currentTheme
        );
}
