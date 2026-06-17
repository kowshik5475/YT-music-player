// search.js

function initializeSearch() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    searchInput.addEventListener(
        "keyup",
        function () {

            const value =
                this.value
                .toLowerCase()
                .trim();

            const playlistItems =
                document.querySelectorAll(
                    "#playlist li"
                );

            playlistItems.forEach(
                item => {

                const text =
                    item.textContent
                    .toLowerCase();

                item.style.display =
                    text.includes(value)
                    ? "block"
                    : "none";
            });
        }
    );
}