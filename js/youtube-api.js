// youtube-api.js

const API_KEY =
"YOUR_YOUTUBE_API_KEY";

async function searchYouTube(
    query
) {

    try {

        const response =
            await fetch(
`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${API_KEY}`
            );

        const data =
            await response.json();

        return data.items;

    } catch(error){

        console.error(
            "YouTube Search Error",
            error
        );

        return [];
    }
}