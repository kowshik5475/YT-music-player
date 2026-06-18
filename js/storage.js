// storage.js

const DEFAULT_PLAYLIST_ID = "default";

const DEFAULT_SONGS = [
    {
        videoId: "7wtfhZwyrcc",
        title: "Believer",
        artist: "Imagine Dragons",
        cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800"
    },
    {
        videoId: "ktvTqknDobU",
        title: "Radioactive",
        artist: "Imagine Dragons",
        cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800"
    },
    {
        videoId: "fKopy74weus",
        title: "Thunder",
        artist: "Imagine Dragons",
        cover: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=800"
    },
    {
        videoId: "JGwWNGJdvx8",
        title: "Shape Of You",
        artist: "Ed Sheeran",
        cover: "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=800"
    },
    {
        videoId: "RgKAFK5djSk",
        title: "See You Again",
        artist: "Wiz Khalifa",
        cover: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800"
    }
];

const StorageManager = {

    getPlaylists() {
        const data = localStorage.getItem("playlists_v2");
        if (data) return JSON.parse(data);
        const defaults = {
            [DEFAULT_PLAYLIST_ID]: {
                id: DEFAULT_PLAYLIST_ID,
                name: "My Playlist",
                songs: DEFAULT_SONGS
            }
        };
        this.savePlaylists(defaults);
        return defaults;
    },

    savePlaylists(playlists) {
        localStorage.setItem("playlists_v2", JSON.stringify(playlists));
    },

    getActivePlaylistId() {
        return localStorage.getItem("activePlaylistId") || DEFAULT_PLAYLIST_ID;
    },

    setActivePlaylistId(id) {
        localStorage.setItem("activePlaylistId", id);
    },

    getActivePlaylist() {
        const playlists = this.getPlaylists();
        const id = this.getActivePlaylistId();
        return playlists[id] || playlists[DEFAULT_PLAYLIST_ID];
    },

    createPlaylist(name) {
        const playlists = this.getPlaylists();
        const id = "pl_" + Date.now();
        playlists[id] = { id, name, songs: [] };
        this.savePlaylists(playlists);
        return id;
    },

    deletePlaylist(id) {
        if (id === DEFAULT_PLAYLIST_ID) return false;
        const playlists = this.getPlaylists();
        delete playlists[id];
        this.savePlaylists(playlists);
        if (this.getActivePlaylistId() === id) {
            this.setActivePlaylistId(DEFAULT_PLAYLIST_ID);
        }
        return true;
    },

    renamePlaylist(id, name) {
        const playlists = this.getPlaylists();
        if (playlists[id]) {
            playlists[id].name = name;
            this.savePlaylists(playlists);
        }
    },

    addSongToPlaylist(playlistId, song) {
        const playlists = this.getPlaylists();
        if (!playlists[playlistId]) return false;
        const exists = playlists[playlistId].songs.some(s => s.videoId === song.videoId);
        if (!exists) {
            playlists[playlistId].songs.push(song);
            this.savePlaylists(playlists);
            return true;
        }
        return false;
    },

    removeSongFromPlaylist(playlistId, videoId) {
        const playlists = this.getPlaylists();
        if (!playlists[playlistId]) return false;
        playlists[playlistId].songs = playlists[playlistId].songs.filter(s => s.videoId !== videoId);
        this.savePlaylists(playlists);
        return true;
    },

    getFavorites() {
        return JSON.parse(localStorage.getItem("favorites")) || [];
    },

    saveFavorites(favorites) {
        localStorage.setItem("favorites", JSON.stringify(favorites));
    },

    addFavorite(song) {
        let favorites = this.getFavorites();
        const exists = favorites.some(item => item.videoId === song.videoId);
        if (!exists) {
            favorites.push(song);
            this.saveFavorites(favorites);
        }
    },

    removeFavorite(videoId) {
        let favorites = this.getFavorites().filter(s => s.videoId !== videoId);
        this.saveFavorites(favorites);
    },

    isFavorite(videoId) {
        return this.getFavorites().some(s => s.videoId === videoId);
    },

    getRecentSongs() {
        return JSON.parse(localStorage.getItem("recentSongs")) || [];
    },

    saveRecentSong(song) {
        let recent = this.getRecentSongs().filter(s => s.videoId !== song.videoId);
        recent.unshift(song);
        recent = recent.slice(0, 10);
        localStorage.setItem("recentSongs", JSON.stringify(recent));
    },

    saveTheme(theme) {
        localStorage.setItem("theme", theme);
    },

    getTheme() {
        return localStorage.getItem("theme") || "dark";
    },

    getShuffleMode() {
        return localStorage.getItem("shuffleMode") === "true";
    },

    saveShuffleMode(val) {
        localStorage.setItem("shuffleMode", val ? "true" : "false");
    },

    getRepeatMode() {
        return localStorage.getItem("repeatMode") || "off";
    },

    saveRepeatMode(mode) {
        localStorage.setItem("repeatMode", mode);
    }

};
