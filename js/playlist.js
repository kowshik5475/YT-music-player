// playlist.js

const playlist = [

{
    videoId: "7wtfhZwyrcc",
    title: "Believer",
    artist: "Imagine Dragons",
    cover:
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800"
},

{
    videoId: "ktvTqknDobU",
    title: "Radioactive",
    artist: "Imagine Dragons",
    cover:
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800"
},

{
    videoId: "fKopy74weus",
    title: "Thunder",
    artist: "Imagine Dragons",
    cover:
    "https://images.unsplash.com/photo-1501612780327-45045538702b?w=800"
},

{
    videoId: "JGwWNGJdvx8",
    title: "Shape Of You",
    artist: "Ed Sheeran",
    cover:
    "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=800"
},

{
    videoId: "RgKAFK5djSk",
    title: "See You Again",
    artist: "Wiz Khalifa",
    cover:
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800"
}

];

let currentIndex = 0;

function renderPlaylist() {

    const playlistElement =
        document.getElementById(
            "playlist"
        );

    playlistElement.innerHTML = "";

    playlist.forEach(
        (song, index) => {

        const li =
            document.createElement(
                "li"
            );

        li.innerHTML = `
            <strong>
                ${song.title}
            </strong>
            <br>
            <small>
                ${song.artist}
            </small>
        `;

        li.addEventListener(
            "click",
            () => {

                loadSong(index);

            }
        );

        playlistElement
            .appendChild(li);
    });
}

function renderFavorites() {

    const list =
        document.getElementById(
            "favoritesList"
        );

    list.innerHTML = "";

    const favorites =
        StorageManager
        .getFavorites();

    favorites.forEach(song => {

        const li =
            document.createElement(
                "li"
            );

        li.innerHTML = `
            ❤️ ${song.title}
        `;

        li.onclick = () => {

            const index =
                playlist.findIndex(
                    item =>
                    item.videoId ===
                    song.videoId
                );

            if(index !== -1){

                loadSong(index);

            }
        };

        list.appendChild(li);
    });
}

function renderRecentSongs() {

    const list =
        document.getElementById(
            "recentList"
        );

    list.innerHTML = "";

    const recent =
        StorageManager
        .getRecentSongs();

    recent.forEach(song => {

        const li =
            document.createElement(
                "li"
            );

        li.innerHTML =
            `🕒 ${song.title}`;

        li.onclick = () => {

            const index =
                playlist.findIndex(
                    item =>
                    item.videoId ===
                    song.videoId
                );

            if(index !== -1){

                loadSong(index);

            }
        };

        list.appendChild(li);
    });
}