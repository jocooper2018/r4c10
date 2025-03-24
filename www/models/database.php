<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/../config/connect-param.php');

class Database {

    use ConnectionParam;

    private PDO $connection;

    public function __construct() {
        try
        {
            $this->connection = new PDO("$this->driver:host=$this->server;dbname=$this->dbname;", $this->user, $this->pass);
            $this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->connection->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $this->connection->prepare("SET SCHEMA 'r4c10';")->execute();
        }
        catch (PDOException $exception)
        {
            http_response_code(500);
            echo('Connection to database error: ' . $exception->getMessage());
            exit(1);
        }
    }

    public function get_connexion() : PDO {
        return $this->connection;
    }
}
