<?php

namespace App\Service;

class GetEnv {

    public static function get($name) {
        return $_ENV[$name] ?? '';
    }

}