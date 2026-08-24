<?php

return [
    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-2.0-flash-exp'),
    ],
    'recraft' => [
        'api_key' => env('RECRAFT_API_KEY'),
        'model' => env('RECRAFT_MODEL', 'recraftv3'),
    ],
];
