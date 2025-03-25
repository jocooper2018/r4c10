document.addEventListener("DOMContentLoaded", () => {
    
    const searchInput = document.getElementById("search-input");
    const searchButton = document.getElementById("search-button");
    const searchResultList = document.getElementById("search-result-list");
    const pos = document.getElementById("pos");
    const nextButton = document.getElementById("next-button");
    const prevButton = document.getElementById("prev-button");
    const firstButton = document.getElementById("first-button");
    const lastButton = document.getElementById("last-button");
    const searchInProgressDiv = document.getElementById("search-in-progress");

    const max = 10;

    let nbPublications = 0;
    let firstHit = 0;
    let nbSent = 0;

    var currentPage = 1;
    var nbPages = 1;

    var searchInProgress = false;


    function deleteChildren(node) {
        node.innerHTML = "";
    }


    function createLi(hit) {
        const li = document.createElement("li");

        const divTitle = document.createElement("div");
        const spanTitle = document.createElement("h3");
        spanTitle.innerHTML = hit.publication_title;
        divTitle.appendChild(spanTitle);
        li.appendChild(divTitle);

        const divYearType = document.createElement("div");
        const spanYear = document.createElement("span");
        spanYear.innerText = hit.publication_year;
        divYearType.appendChild(spanYear);
        const spanType = document.createElement("span");
        spanType.innerHTML = hit.publication_type;
        divYearType.appendChild(spanType);
        li.appendChild(divYearType);

        const divVenuePages = document.createElement("div");
        const spanVenue = document.createElement("span");
        spanVenue.innerHTML = hit.publication_venue;
        divVenuePages.appendChild(spanVenue);
        const spanPages = document.createElement("span");
        spanPages.innerHTML = hit.publication_pages;
        divVenuePages.appendChild(spanPages);
        li.appendChild(divVenuePages);

        const divAuthors = document.createElement("div");
        const spanAuthors = document.createElement("span");
        spanAuthors.innerText = "Authors:";
        divAuthors.appendChild(spanAuthors);
        const olAuthor = document.createElement("ol");
        for (const author of hit.authors) {
            const liAuthor = document.createElement("li");
            liAuthor.innerHTML = author.author_text;
            olAuthor.appendChild(liAuthor);
        }
        divAuthors.appendChild(olAuthor);
        li.appendChild(divAuthors);

        const divLinks = document.createElement("div");
        const dblpUrl = document.createElement("a");
        dblpUrl.href = hit.publication_url;
        dblpUrl.innerText = "View on dblp";
        dblpUrl.target = "_blank";
        divLinks.appendChild(dblpUrl);
        const ee = document.createElement("a");
        ee.href = hit.publication_ee;
        ee.innerText = "View electronic edition";
        ee.target = "_blank";
        divLinks.appendChild(ee);
        li.appendChild(divLinks);
        
        searchResultList.appendChild(li);
    }

    async function handleSearch(page) {
        try {
            if (searchInProgress) return;
            searchInProgress = true;
            searchInProgressDiv.style.display = "block";
            deleteChildren(searchResultList);
            let query = `/api/publication/?nb=${max}&page=${page}&title=${searchInput.value}`;
            let response = await fetch(query);
            if (!response.ok) {
                try {
                    let data = await response.json();
                    console.error(data);
                }
                catch (error) {}
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            let data = await response.json()
            // console.log(data);
            for (const hit of data.body.publications) {
                createLi(hit);
            }
            currentPage = Number(data.body.current_page);
            nbPages = Number(data.body.nb_pages);
            nbPublications = Number(data.body.nb_publications);
            firstHit = Number(data.body.start);
            nbSent = Number(data.body.nb_sent);

            deleteChildren(pos);

            const maxPagesShown = 10;
            const nbBeforeFirst = Math.floor((maxPagesShown - 1) / 2);
            let start = Math.max(1, Math.min(currentPage - nbBeforeFirst, nbPages - maxPagesShown + 1));
            for (let i = start; i < Math.min(start + maxPagesShown, nbPages + 1); i++) {
                const button = document.createElement("button");
                button.type = "button";
                button.innerText = `${i}`;
                if (i === currentPage) {
                    button.classList.add("current");
                    button.disabled = true;
                }
                else {
                    button.addEventListener("click", () => {
                        handleSearch(i);
                    });
                }
                pos.appendChild(button);
            }

            firstButton.disabled = (currentPage <= 1) || (nbPublications <= 0);
            prevButton.disabled = (currentPage <= 1) || (nbPublications <= 0);
            nextButton.disabled = (currentPage >= nbPages) || (nbPublications <= 0);
            lastButton.disabled = (currentPage >= nbPages) || (nbPublications <= 0);
        } catch (error) {
            deleteChildren(pos);
            console.error(error);
        }
        searchInProgress = false;
        searchInProgressDiv.style.display = "none";
    }

    searchButton.addEventListener("click", () => {
        handleSearch(1);
    });

    nextButton.addEventListener("click", () => {
        if (searchInProgress || (currentPage >= nbPages)) return;
        handleSearch(currentPage + 1);
    });

    prevButton.addEventListener("click", () => {
        if (searchInProgress || (currentPage <= 1)) return;
        handleSearch(currentPage - 1);
    });

    firstButton.addEventListener("click", () => {
        if (searchInProgress || (currentPage <= 1)) return;
        handleSearch(1);
    });

    lastButton.addEventListener("click", () => {
        if (searchInProgress || (currentPage >= nbPages)) return;
        handleSearch(nbPages);
    });

    firstButton.disabled = true;
    nextButton.disabled = true;
    prevButton.disabled = true;
    lastButton.disabled = true;
});