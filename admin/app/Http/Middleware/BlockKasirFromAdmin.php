<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class BlockKasirFromAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated
        if (Auth::check()) {
            $user = Auth::user();
            
            // Block kasir role from admin panel
            if ($user->role === 'kasir') {
                Auth::logout();
                
                return redirect()
                    ->route('filament.admin.auth.login')
                    ->with('error', 'Akun kasir tidak memiliki akses ke admin panel. Silakan gunakan aplikasi POS.');
            }
        }
        
        return $next($request);
    }
}
