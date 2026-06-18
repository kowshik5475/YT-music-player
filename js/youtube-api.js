// youtube-api.js — search via Invidious (no API key needed)

const INVIDIOUS_INSTANCES = [
    "https://invidious.privacydev.net",
    "https://inv.nadeko.net",
    "https://yt.artemislena.eu",
    "https://invidious.nerdvpn.de"
];

async function searchYouTube(query) {
    const fields = "videoId,title,author,videoThumbnails,lengthSeconds";
    for (const instance of INVIDIOUS_INSTANCES) {
        try {
            const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&fields=${fields}`;
            const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) continue;
            const data = await res.json();
            if (!Array.isArray(data)) continue;
            return data.map(item => ({
                videoId: item.videoId,
                title: item.title,
                artist: item.author,
                cover: getBestThumbnail(item.videoThumbnails)
            }));
        } catch (e) {
            continue;
        }
    }
    return [];
}

function getBestThumbnail(thumbnails) {
    if (!thumbnails || !thumbnails.length) {
        return "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400";
    }
    const preferred = thumbnails.find(t => t.quality === "medium" || t.quality === "default");
    const chosen = preferred || thumbnails[0];
    let url = chosen.url || "";
    if (url.startsWith("//")) url = "https:" + url;
    return url || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400";
}
