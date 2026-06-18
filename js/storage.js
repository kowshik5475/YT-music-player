// storage.js

const DEFAULT_PLAYLIST_ID = "default";

const DEFAULT_SONGS = [
    { videoId: "7wtfhZwyrcc", title: "Believer",    artist: "Imagine Dragons", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400" },
    { videoId: "ktvTqknDobU", title: "Radioactive", artist: "Imagine Dragons", cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400" },
    { videoId: "fKopy74weus", title: "Thunder",      artist: "Imagine Dragons", cover: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=400" },
    { videoId: "JGwWNGJdvx8", title: "Shape Of You", artist: "Ed Sheeran",     cover: "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=400" },
    { videoId: "RgKAFK5djSk", title: "See You Again", artist: "Wiz Khalifa",   cover: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400" }
];

const StorageManager = {

    // ── LIBRARY ──────────────────────────────────────────────────────────────

    getLibrary() {
        const data = localStorage.getItem("songs_library_v1");
        if (data) return JSON.parse(data);
        const lib = {};
        DEFAULT_SONGS.forEach(s => { lib[s.videoId] = s; });
        this.saveLibrary(lib);
        return lib;
    },

    saveLibrary(lib) {
        localStorage.setItem("songs_library_v1", JSON.stringify(lib));
    },

    addToLibrary(song) {
        const lib = this.getLibrary();
        if (!lib[song.videoId]) {
            lib[song.videoId] = { videoId: song.videoId, title: song.title, artist: song.artist, cover: song.cover };
            this.saveLibrary(lib);
            return true;
        }
        return false;
    },

    removeFromLibrary(videoId) {
        const lib = this.getLibrary();
        delete lib[videoId];
        this.saveLibrary(lib);
        // Cascade: remove from all playlists
        const pls = this.getPlaylists();
        Object.values(pls).forEach(pl => {
            pl.videoIds = pl.videoIds.filter(id => id !== videoId);
        });
        this.savePlaylists(pls);
        // Cascade: remove from favorites
        this.removeFavorite(videoId);
    },

    getLibrarySong(videoId) {
        return this.getLibrary()[videoId] || null;
    },

    getLibrarySongs() {
        return Object.values(this.getLibrary());
    },

    isInLibrary(videoId) {
        return !!this.getLibrary()[videoId];
    },

    // ── PLAYLISTS ─────────────────────────────────────────────────────────────

    getPlaylists() {
        const data = localStorage.getItem("playlists_v3");
        if (data) return JSON.parse(data);
        return this._initPlaylists();
    },

    _initPlaylists() {
        const pls = {};
        // Migrate from playlists_v2 if it exists
        const v2raw = localStorage.getItem("playlists_v2");
        if (v2raw) {
            try {
                const v2 = JSON.parse(v2raw);
                Object.values(v2).forEach(pl => {
                    const videoIds = [];
                    (pl.songs || []).forEach(s => {
                        this.addToLibrary(s);
                        videoIds.push(s.videoId);
                    });
                    pls[pl.id] = { id: pl.id, name: pl.name, description: "", videoIds, createdAt: Date.now() };
                });
            } catch(e) { /* migration failed, fall through */ }
        }
        // Bootstrap default playlist if nothing migrated
        if (!Object.keys(pls).length) {
            const defaultIds = DEFAULT_SONGS.map(s => s.videoId);
            pls[DEFAULT_PLAYLIST_ID] = {
                id: DEFAULT_PLAYLIST_ID, name: "My Playlist",
                description: "Your default playlist", videoIds: defaultIds, createdAt: Date.now()
            };
        }
        this.savePlaylists(pls);
        return pls;
    },

    savePlaylists(pls) {
        localStorage.setItem("playlists_v3", JSON.stringify(pls));
    },

    createPlaylist(name, description = "") {
        const pls = this.getPlaylists();
        const id = "pl_" + Date.now();
        pls[id] = { id, name, description, videoIds: [], createdAt: Date.now() };
        this.savePlaylists(pls);
        return id;
    },

    deletePlaylist(id) {
        if (id === DEFAULT_PLAYLIST_ID) return false;
        const pls = this.getPlaylists();
        delete pls[id];
        this.savePlaylists(pls);
        if (this.getActivePlaylistId() === id) this.setActivePlaylistId(DEFAULT_PLAYLIST_ID);
        return true;
    },

    renamePlaylist(id, name, description) {
        const pls = this.getPlaylists();
        if (!pls[id]) return;
        pls[id].name = name;
        if (description !== undefined) pls[id].description = description;
        this.savePlaylists(pls);
    },

    addSongToPlaylist(playlistId, videoId) {
        const pls = this.getPlaylists();
        if (!pls[playlistId]) return false;
        if (!pls[playlistId].videoIds.includes(videoId)) {
            pls[playlistId].videoIds.push(videoId);
            this.savePlaylists(pls);
            return true;
        }
        return false;
    },

    removeSongFromPlaylist(playlistId, videoId) {
        const pls = this.getPlaylists();
        if (!pls[playlistId]) return false;
        pls[playlistId].videoIds = pls[playlistId].videoIds.filter(id => id !== videoId);
        this.savePlaylists(pls);
        return true;
    },

    isSongInPlaylist(playlistId, videoId) {
        const pls = this.getPlaylists();
        return !!(pls[playlistId] && pls[playlistId].videoIds.includes(videoId));
    },

    getPlaylistSongs(playlistId) {
        const pls = this.getPlaylists();
        const pl  = pls[playlistId];
        if (!pl) return [];
        const lib = this.getLibrary();
        return pl.videoIds.map(id => lib[id]).filter(Boolean);
    },

    getActivePlaylistId() {
        return localStorage.getItem("activePlaylistId") || DEFAULT_PLAYLIST_ID;
    },

    setActivePlaylistId(id) {
        localStorage.setItem("activePlaylistId", id);
    },

    getActivePlaylist() {
        const pls = this.getPlaylists();
        const id  = this.getActivePlaylistId();
        return pls[id] || pls[DEFAULT_PLAYLIST_ID];
    },

    // ── FAVORITES ─────────────────────────────────────────────────────────────

    getFavorites()       { return JSON.parse(localStorage.getItem("favorites")) || []; },
    saveFavorites(f)     { localStorage.setItem("favorites", JSON.stringify(f)); },
    addFavorite(song)    {
        let f = this.getFavorites();
        if (!f.some(s => s.videoId === song.videoId)) { f.push(song); this.saveFavorites(f); }
    },
    removeFavorite(vid)  { this.saveFavorites(this.getFavorites().filter(s => s.videoId !== vid)); },
    isFavorite(vid)      { return this.getFavorites().some(s => s.videoId === vid); },

    // ── RECENT ────────────────────────────────────────────────────────────────

    getRecentSongs() { return JSON.parse(localStorage.getItem("recentSongs")) || []; },
    saveRecentSong(song) {
        let r = this.getRecentSongs().filter(s => s.videoId !== song.videoId);
        r.unshift(song);
        localStorage.setItem("recentSongs", JSON.stringify(r.slice(0, 20)));
    },

    // ── PREFS ─────────────────────────────────────────────────────────────────

    saveTheme(t)    { localStorage.setItem("theme", t); },
    getTheme()      { return localStorage.getItem("theme") || "dark"; },
    getShuffleMode(){ return localStorage.getItem("shuffleMode") === "true"; },
    saveShuffleMode(v){ localStorage.setItem("shuffleMode", v ? "true" : "false"); },
    getRepeatMode() { return localStorage.getItem("repeatMode") || "off"; },
    saveRepeatMode(m){ localStorage.setItem("repeatMode", m); }

};
