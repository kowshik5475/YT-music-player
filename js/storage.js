// storage.js

const StorageManager = {

    getFavorites() {
        return JSON.parse(
            localStorage.getItem("favorites")
        ) || [];
    },

    saveFavorites(favorites) {
        localStorage.setItem(
            "favorites",
            JSON.stringify(favorites)
        );
    },

    addFavorite(song) {

        let favorites =
            this.getFavorites();

        const exists =
            favorites.some(
                item =>
                item.videoId === song.videoId
            );

        if (!exists) {

            favorites.push(song);

            this.saveFavorites(
                favorites
            );
        }
    },

    removeFavorite(videoId) {

        let favorites =
            this.getFavorites();

        favorites =
            favorites.filter(
                song =>
                song.videoId !== videoId
            );

        this.saveFavorites(
            favorites
        );
    },

    isFavorite(videoId) {

        return this
            .getFavorites()
            .some(
                song =>
                song.videoId === videoId
            );
    },

    getRecentSongs() {

        return JSON.parse(
            localStorage.getItem(
                "recentSongs"
            )
        ) || [];
    },

    saveRecentSong(song) {

        let recent =
            this.getRecentSongs();

        recent =
            recent.filter(
                item =>
                item.videoId !==
                song.videoId
            );

        recent.unshift(song);

        recent = recent.slice(0, 10);

        localStorage.setItem(
            "recentSongs",
            JSON.stringify(recent)
        );
    },

    saveTheme(theme) {

        localStorage.setItem(
            "theme",
            theme
        );
    },

    getTheme() {

        return (
            localStorage.getItem(
                "theme"
            ) || "dark"
        );
    }

};