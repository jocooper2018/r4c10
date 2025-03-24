<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/../models/database.php');

class Model {

    private PDO $database;

    public function __construct() {
        $db = new Database();
        $this->database = $db->get_connexion();
    }

    public function create_author(string $author_pid, string $author_name) : void {
        $query = "INSERT INTO _author (author_pid, author_text) VALUES (?, ?);";
        $statement = $this->database->prepare($query);
        $statement->execute([$author_pid, $author_name]);
    }

    public function get_all_authors() : array {
        $query = "SELECT * FROM _author;";
        $statement = $this->database->prepare($query);
        $statement->execute();
        return $statement->fetchAll();
    }

    public function get_author_name(string $author_pid) : string {
        $query = "SELECT author_text FROM _author WHERE author_pid = ?;";
        $statement = $this->database->prepare($query);
        $statement->execute([$author_pid]);
        return $statement->fetch();
    }

    public function get_authors_of_publication(int $publication_id) : array {
        $query = 'SELECT _author.*, author_order FROM _author INNER JOIN _author_publish ON _author.author_pid = _author_publish.author_pid WHERE publication_id = ? ORDER BY author_order ASC;';
        $statement = $this->database->prepare($query);
        $statement->execute([$publication_id]);
        return $statement->fetchAll();
    }

    public function author_exists(string $author_pid_or_text) : bool {
        $query = 'SELECT COUNT(*) FROM _author WHERE (author_pid = ?) OR (author_text = ?)';
        $statement = $this->database->prepare($query);
        $statement->execute([$author_pid_or_text, $author_pid_or_text]);
        return $statement->fetch()['count'] > 0;
    }

    public static function is_a_publication(array $publication) : bool {
        return  isset($publication['publication_title']) &&
                isset($publication['publication_year']) &&
                isset($publication['publication_type']) &&
                isset($publication['publication_venue']) &&
                isset($publication['publication_ee']) &&
                isset($publication['publication_url'])
        ;
    }

    public static function contain_only_publication(array $publications) : bool {
        foreach ($publications as $publication) {
            try {
                if (!Model::is_a_publication($publication)) {
                    return false;
                }
            }
            catch (TypeError $error) {
                return false;
            }
        }
        return true;
    }

    public function insert_into_publication(
        string $title, 
        string $year, 
        string $type, 
        string $venue,
        ?string $pages,
        ?string $doi,
        string $ee,
        string $url
    ) : int {
        $query = 'INSERT INTO _publication ('.
            '"publication_title",'.
            '"publication_year",'.
            '"publication_type",'.
            '"publication_venue",'.
            '"publication_pages",'.
            '"publication_doi",'.
            '"publication_ee",'.
            '"publication_url"'.
        ') VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING "publication_id";';
        $statement = $this->database->prepare($query);
        $statement->execute([$title, $year, $type, $venue, $pages, $doi, $ee, $url]);
        $publication_id = $statement->fetch()['publication_id'];
        return $publication_id;
    }

    public function get_all_publication() : array {
        $query = 'SELECT * FROM _publication;';
        $statement = $this->database->prepare($query);
        $statement->execute();
       return $this->add_authors_to_publications($statement->fetchAll());
    }

    public function insert_into_author_publish(string $author_id, int $publication_id, int $author_order) : void {
        $query = 'INSERT INTO _author_publish (author_pid, publication_id, author_order) VALUES (?, ?, ?);';
        $statement = $this->database->prepare($query);
        $statement->execute([$author_id, $publication_id, $author_order]);
    }

    public function create_publication(
        string $publication_title, 
        string $publication_year, 
        string $publication_type, 
        string $publication_venue,
        ?string $publication_pages,
        ?string $publication_doi,
        string $publication_ee,
        string $publication_url,
        array $authors
    ) : int {
        $publication_id = $this->insert_into_publication(
                            $publication_title, 
                            $publication_year, 
                            $publication_type, 
                            $publication_venue, 
                            $publication_pages, 
                            $publication_doi, 
                            $publication_ee, 
                            $publication_url
                        );
        foreach ($authors as $author_order => $author) {
            if (!$this->author_exists($author['author_pid'])) {
                $this->create_author($author['author_pid'], html_entity_decode($author['author_text']));
            }
            $this->insert_into_author_publish($author['author_pid'], $publication_id, $author_order);
        }
        return $publication_id;
    }

    public function publication_exists(string $publication_url) : bool {
        $query = 'SELECT COUNT(*) FROM _publication WHERE (publication_url = ?)';
        $statement = $this->database->prepare($query);
        $statement->execute([$publication_url]);
        return $statement->fetch()['count'] > 0;
    }

    public function add_authors_to_publication(array $publication) : array {
        if (!Model::is_a_publication($publication)) {
            throw new Exception('Not a publication');
        }
        $publication['authors'] = $this->get_authors_of_publication($publication['publication_id']);
        return $publication;
    }

    public function add_authors_to_publications(array $publications) : array {
        foreach ($publications as $key => $publication) {
            $publications[$key] = $this->add_authors_to_publication($publication);
        }
        return $publications;
    }

    public function search_publication(array $params) : array {

        if (isset($params['page']) && isset($params['first'])) {
            throw new Exception('page and first can\'t be set at the same time');
        }

        $limit = 10;
        $page = 1;
        $offset = 0;
        if (isset($params['nb'])) {
            if (
                !is_numeric($params['nb']) || 
                (intval($params['nb']) != floatval($params['nb']))
            ) {
                throw new TypeError('Param \'nb\' must be of type int');
            }
            $limit = intval($params['nb']);
        }
        if (isset($params['page'])) {
            if (
                !is_numeric($params['page']) || 
                (intval($params['page']) != floatval($params['page']))
            ) {
                throw new TypeError('Param \'page\' must be of type int');
            }
            $page = intval($params['page']);
            $offset = $limit * ($page - 1);
        }
        else if (isset($params['first'])) {
            if (
                !is_numeric($params['first']) || 
                (intval($params['first']) != floatval($params['first']))
            ) {
                throw new TypeError('Param \'first\' must be of type int');
            }
            $offset = intval($params['first']);
        }

        if ($page < 1) {
            throw new Exception('Param \'page\' can\'t be < 1.');
        }

        $query = 'SELECT _publication.* FROM _publication';
        $query_count = 'SELECT COUNT(_publication.*) FROM _publication';

        $first_loop = true;
        foreach ($params as $key => $value) {
            if (($key === 'page') || ($key === 'nb') || ($key === 'first') || ($value === '')) {
                continue;
            }
            if (preg_match('/^[a-zA-Z_0-9]+$/', $key) !== 1) {
                throw new Exception("'$key' is not a valid key");
            }
            $value = preg_replace('/[^A-Za-z0-9]/', '%', $value);
            if ($first_loop) {
                $query .= ' WHERE';
                $query_count .= ' WHERE';
                $first_loop = false;
            } else {
                $query .= ' AND';
                $query_count .= ' AND';
            }
            switch ($key) {
                case 'title':
                    $query .= " publication_title ILIKE '%$value%'";
                    $query_count .= " publication_title ILIKE '%$value%'";
                    break;
                case 'year':
                    if (preg_match('/^[0-9]+$/', $value) !== 1) {
                        throw new Exception('year must be a positive integer');
                    }
                    $query .= " publication_year = $value";
                    $query_count .= " publication_year = $value";
                    break;
                case 'type':    
                    $query .= " publication_type ILIKE '%$value%'";
                    $query_count .= " publication_type ILIKE '%$value%'";
                    break;
                case 'venue':
                    $query .= " publication_venue ILIKE '%$value%'";
                    $query_count .= " publication_venue ILIKE '%$value%'";
                    break;
                
                default:
                    throw new Exception("Unknown query term '$key'");
                    break;
            }
        }
        $query .= " OFFSET $offset LIMIT $limit;";
        // echo($query);

        $statement_count = $this->database->prepare($query_count);
        $statement_count->execute();
        $nb_publications = $statement_count->fetch()['count'];

        $statement = $this->database->prepare($query);
        $statement->execute();
        $publications = $this->add_authors_to_publications($statement->fetchAll());

        $nb_sent = count($publications);

        $result = array();

        $result['nb_publications'] = $nb_publications;
        $result['start'] = $offset;
        $result['nb_sent'] = $nb_sent;
        $result['nb_pages'] = ceil($result['nb_publications'] / $limit);
        $result['current_page'] = $nb_publications === 0 ? 0 : $page;
        $result['publications'] = $publications;

        return $result;
    }
}