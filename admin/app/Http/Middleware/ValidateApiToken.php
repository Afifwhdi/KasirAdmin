<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateApiToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken() ?? $request->header('X-API-Token');

        // Get API token from environment
        $validToken = config('app.api_token');

        if (!$token) {
            return response()->json([
                'status' => 'error',
                'message' => 'API token is required. Please provide token in Authorization header: Bearer YOUR_TOKEN',
            ], 401);
        }

        if ($token !== $validToken) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid API token',
            ], 401);
        }

        return $next($request);
    }
}
