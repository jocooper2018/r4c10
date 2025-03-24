<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/../models/model.php');

header('Content-Type: application/json');
error_reporting(0);

// http_response_code(503);
// echo(json_encode(['error' => 'not available yet']));
// exit();


function respond(int $code, string $message, string|array|null $details = null, ?array $body = null) : void {
    http_response_code($code);
    $response = array(
        'status' => array(
            'code' => $code,
            'message' => $message,
            'details' => $details
        ),
        'body' => $body
    );
    echo(json_encode($response));
}

function handle_get() : void {
    try {
        $model = new Model();
        $result = $model->search_publication($_GET);
        respond(200, 'OK', null, $result);
    }
    catch (Throwable $exception) {
        if (preg_match('/^Unknown query term/', $exception->getMessage())) {
            respond(400, 'Bad Request', $exception->getMessage());
        }
        else if (preg_match('/^year must be a positive integer$/', $exception->getMessage())) {
            respond(400, 'Bad Request', $exception->getMessage());
        }
        else {
            respond(500, 'Internal Server Error', $exception->getMessage());
        }
    }
}

function handle_post() : void {
    try {
        $model = new Model();
        $body = file_get_contents('php://input');
        if ($body === false) {
            respond(500, 'Internal Server Error', 'Error on file_get_contents(\'php://input\').');
            return;
        }
        $publications = json_decode($body, true);
        if ($publications === false || $publications === null) {
            respond(400, 'Bad Request', 'Not a valid json.');
            return;
        }
        // print_r($publications);
        // if (!Model::contain_only_publication($publications)) {
        //     respond(400, 'Bad Request', 'Not a valid publication.');
        //     return;
        // }

        $nb_publication_created = 0;
        foreach ($publications as $publication) {
            if (!Model::is_a_publication($publication))
                continue;
            if ($model->publication_exists($publication['publication_url']))
                continue;
            $model->create_publication(
                $publication['publication_title'],
                $publication['publication_year'],
                $publication['publication_type'],
                $publication['publication_venue'],
                $publication['publication_pages'],
                $publication['publication_doi'],
                $publication['publication_ee'],
                $publication['publication_url'],
                $publication['authors']
            );
            $nb_publication_created++;
        }
        
        respond(201, 'Created', "$nb_publication_created publication" . ($nb_publication_created === 1 ? '' : 's') . ' created.');
    }
    catch (Throwable $exception) {
        respond(500, 'Internal Server Error', $exception->getMessage());
    }
}

$REQUEST_METHOD = $_SERVER['REQUEST_METHOD'];

switch ($REQUEST_METHOD) {
    case 'GET':
        handle_get();
        break;
    case 'POST':
        handle_post();
        break;
    default:
        respond(501, 'Not Implemented', "Method $REQUEST_METHOD not implemented.");
        break;
}
