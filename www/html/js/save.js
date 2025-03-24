function replaceUndefinedByNull(key, value) {
    return value === undefined ? null : value;
}

async function postData(data) {
    const response = await fetch('/api/publication/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data, replaceUndefinedByNull)
    });
    console.log(`HTTP status: ${response.status}`);
    const text = await response.text();
    console.log(`Raw response: ${text}`);
    try {
        return JSON.parse(text);
    }
    catch (error) {
        console.error("Failed to parse JSON:", error);
        throw new Error("Invalid JSON response from server");
    }
}

function adaptPublication(publication) {
    let result = {
        publication_title: publication.info.title,
        publication_year: publication.info.year,
        publication_type: publication.info.type,
        publication_venue: publication.info.venue,
        publication_pages: publication.info.pages,
        publication_doi: publication.info.doi,
        publication_ee: publication.info.ee,
        publication_url: publication.info.url,
        authors: []
    };
    if (publication.info.authors.author.constructor === Array) {
        for (const author of publication.info.authors.author) {
            result.authors.push({
                author_pid: author['@pid'],
                author_text: author.text,
                author_affiliation: null
            });
        }
    }
    else {
        result.authors.push({
            author_pid: publication.info.authors.author['@pid'],
            author_text: publication.info.authors.author.text,
            author_affiliation: null
        });
    }
    return result;
}

function adaptPublications(publications) {
    let result = [];
    for (const publication of publications) {
        if (
            (publication.info.type != 'Conference and Workshop Papers')
            &&
            (publication.info.type != 'Journal Articles')
        ) continue;
        result.push(adaptPublication(publication));
    }
    return result;
}

export async function save(publications) {
    let adaptedPublications = adaptPublications(publications);
    console.log(adaptedPublications);
    return await postData(adaptedPublications);
}
