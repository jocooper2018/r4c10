<?php
http_response_code(503);
header("Content-Type: application/json");
echo(json_encode(["error" => "not available yet"]));
exit();