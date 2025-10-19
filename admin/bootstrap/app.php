<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(HandleCors::class);

        // Trust all proxies (untuk production sesuaikan dengan proxy yang digunakan)
        $middleware->trustProxies(at: '*');

        // Exclude CSRF untuk API routes
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // Register API token middleware alias
        $middleware->alias([
            'api.token' => \App\Http\Middleware\ValidateApiToken::class,
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
