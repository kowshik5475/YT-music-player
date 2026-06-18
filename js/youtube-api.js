// youtube-api.js — search via Invidious (no API key needed)

const INVIDIOUS_INSTANCES = [
    "https://invidious.privacydev.net",
    "https://inv.nadeko.net",
    "https://yt.artemislena.eu",
    "https://invidious.nerdvpn.de"
];

async function fetchWithTimeout(url, ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        return res;
    } catch (e) {
        clearTimeout(timer);
        throw e;
    }
}

async function searchYouTube(query) {
    const fields = "videoId,title,author,videoThumbnails";
    for (const instance of INVIDIOUS_INSTANCES) {
        try {
            const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&fields=${fields}`;
            const res = await fetchWithTimeout(url, 6000);
            if (!res.ok) continue;
            const data = await res.json();
            if (!Array.isArray(data) || !data.length) continue;
            return data.map(item => ({
                videoId: item.videoId,
                title:   item.title || "Unknown Title",
                artist:  item.author || "Unknown Artist",
                cover:   getBestThumbnail(item.videoThumbnails)
            }));
        } catch (e) {
            // try next instance
        }
    }
    return [];
}

function getBestThumbnail(thumbnails) {
    const fallback = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400";
    if (!thumbnails || !thumbnails.length) return fallback;
    const pref = thumbnails.find(t => t.quality === "medium") ||
                 thumbnails.find(t => t.quality === "default") ||
                 thumbnails[0];
    if (!pref) return fallback;
    let url = pref.url || "";
    if (url.startsWith("//")) url = "https:" + url;
    return url || fallback;
}
