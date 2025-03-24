import { save } from '../js/save.js'


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
    const saveButton = document.getElementById("save-button");
    const popup = document.getElementsByClassName("popup-container")[0];

    const max = 10;

    let nbHits = 0;
    let firstHit = 0;
    let nbSent = 0;

    var currentPage = 1;
    var nbPages = 1;

    var searchInProgress = false;

    var publicationsLoaded = Array();

    function deleteChildren(node) {
        node.innerHTML = "";
    }


    function createLi(hit) {
        const li = document.createElement("li");

        const divTitle = document.createElement("div");
        const spanTitle = document.createElement("h3");
        spanTitle.innerText = hit.info.title;
        divTitle.appendChild(spanTitle);
        li.appendChild(divTitle);

        const divYearType = document.createElement("div");
        const spanYear = document.createElement("span");
        spanYear.innerText = hit.info.year;
        divYearType.appendChild(spanYear);
        const spanType = document.createElement("span");
        spanType.innerText = hit.info.type;
        divYearType.appendChild(spanType);
        li.appendChild(divYearType);

        const divVenuePages = document.createElement("div");
        const spanVenue = document.createElement("span");
        spanVenue.innerText = hit.info.venue;
        divVenuePages.appendChild(spanVenue);
        const spanPages = document.createElement("span");
        spanPages.innerText = hit.info.pages;
        divVenuePages.appendChild(spanPages);
        li.appendChild(divVenuePages);

        const divAuthors = document.createElement("div");
        const spanAuthors = document.createElement("span");
        spanAuthors.innerText = "Authors";
        divAuthors.appendChild(spanAuthors);
        const olAuthor = document.createElement("ol");
        // console.log(hit.info.authors.author);
        if (hit.info.authors.author.constructor === Array) {
            for (const author of hit.info.authors.author) {
                const liAuthor = document.createElement("li");
                liAuthor.innerHTML = author.text;
                olAuthor.appendChild(liAuthor);
            }
        } else {
            const liAuthor = document.createElement("li");
            liAuthor.innerText = hit.info.authors.author.text;
            olAuthor.appendChild(liAuthor);
        }
        divAuthors.appendChild(olAuthor);
        li.appendChild(divAuthors);
        
        const divLinks = document.createElement("div");
        const dblpUrl = document.createElement("a");
        dblpUrl.href = hit.info.url;
        dblpUrl.innerText = "View on dblp";
        dblpUrl.target = "_blank";
        divLinks.appendChild(dblpUrl);
        const ee = document.createElement("a");
        ee.href = hit.info.ee;
        ee.innerText = "View electronic edition";
        ee.target = "_blank";
        divLinks.appendChild(ee);
        li.appendChild(divLinks);
        
        searchResultList.appendChild(li);
    }

    // Conference and Workshop Papers
    // Journal Articles

    async function handleSearch(first) {
        // console.log(`first: ${first}`);
        try {
            if (searchInProgress) return;
            searchInProgress = true;
            searchInProgressDiv.style.display = "block";
            deleteChildren(searchResultList);
            let query = `https://dblp.org/search/publ/api?q=${searchInput.value}&h=${max}&f=${first}&c=0&format=json`;
            let response = await fetch(query);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            let data = await response.json();
            publicationsLoaded = data.result.hits.hit;
            for (const hit of publicationsLoaded) {
                createLi(hit);
            }
            nbHits = Math.min(data.result.hits["@total"], 9999);
            firstHit = data.result.hits["@first"];
            nbSent = data.result.hits["@sent"];
            nbPages = Math.ceil(nbHits / max);
            currentPage = firstHit / max + 1;
            // console.log(`nbPages: ${nbPages}, currentPage: ${currentPage}`);

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
                        handleSearch((i - 1) * max);
                    });
                }
                pos.appendChild(button);
            }

            firstButton.disabled = (currentPage <= 1) || (nbHits <= 0);
            prevButton.disabled = (currentPage <= 1) || (nbHits <= 0);
            nextButton.disabled = (currentPage >= nbPages) || (nbHits <= 0);
            lastButton.disabled = (currentPage >= nbPages) || (nbHits <= 0);
        } catch (error) {
            deleteChildren(pos);
            console.error(error);
        }
        searchInProgress = false;
        searchInProgressDiv.style.display = "none";
    }

    async function handleSave() {
        // console.log(publicationsLoaded);
        const response = await save(publicationsLoaded);
        console.log(response);
        showPopup(response.status.details);
    }

    function showPopup(message) {
        const contentContainer = popup.getElementsByClassName("popup-content-container")[0];
        const content = document.createElement("span");
        content.innerText = message;
        contentContainer.appendChild(content);
        popup.style.display = "flex";
    }

    function hidePopup() {
        const contentContainer = popup.getElementsByClassName("popup-content-container")[0];
        deleteChildren(contentContainer);
        popup.style.display = "none";
    }

    searchButton.addEventListener("click", () => {
        handleSearch(0);
    });

    nextButton.addEventListener("click", () => {
        if (searchInProgress || (Number(firstHit) > Number(nbHits))) return;
        handleSearch(Number(firstHit) + max)
    });

    prevButton.addEventListener("click", () => {
        if (searchInProgress || (Number(firstHit) - max < 0)) return;
        handleSearch(Number(firstHit) - max)
    });

    firstButton.addEventListener("click", () => {
        if (searchInProgress || (currentPage <= 1)) return;
        handleSearch(0);
    });

    lastButton.addEventListener("click", () => {
        if (searchInProgress || (currentPage >= nbPages)) return;
        handleSearch(Math.min((nbPages - 1) * max, 9999));
    });

    saveButton.addEventListener("click", handleSave);

    for (const button of popup.getElementsByClassName("close-popup")) {
        button.addEventListener("click", hidePopup);
    }

    firstButton.disabled = true;
    nextButton.disabled = true;
    prevButton.disabled = true;
    lastButton.disabled = true;
});