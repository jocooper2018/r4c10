DROP SCHEMA IF EXISTS r4c10 CASCADE;
CREATE SCHEMA r4c10;
SET SCHEMA 'r4c10';


CREATE TABLE _author (
    "author_pid"            VARCHAR(31) PRIMARY KEY,
    "author_text"           VARCHAR(255) NOT NULL,
    "author_affiliation"    VARCHAR(255)
);


CREATE TABLE _publication (
    "publication_id"    SERIAL PRIMARY KEY,
    "publication_title" VARCHAR(255) NOT NULL,
    "publication_year"  NUMERIC(4, 0) NOT NULL,
    "publication_type"  VARCHAR(255) NOT NULL,
    "publication_venue" VARCHAR(255) NOT NULL,
    "publication_pages" VARCHAR(255),
    "publication_doi"   VARCHAR(295),
    "publication_ee"    VARCHAR(310) UNIQUE NOT NULL,
    "publication_url"   VARCHAR(310) UNIQUE NOT NULL
);


CREATE TABLE _author_publish (
    "author_pid"        VARCHAR(31),
    "publication_id"    INTEGER,
    "author_order"      INTEGER NOT NULL,
    CONSTRAINT _author_publish_pk
        PRIMARY KEY ("author_pid", "publication_id"),
    CONSTRAINT _author_publish_fk_author
        FOREIGN KEY ("author_pid")
        REFERENCES _author("author_pid"),
    CONSTRAINT _author_publish_fk_publication
        FOREIGN KEY ("publication_id")
        REFERENCES _publication("publication_id"),
    CONSTRAINT _author_publish_ak
        UNIQUE ("publication_id", "author_order")
);

