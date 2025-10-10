<?php

namespace App\Http\Responses;

use Filament\Http\Responses\Auth\Contracts\LoginResponse as LoginResponseContract;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Redirector;
use Illuminate\Support\Facades\Auth;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): RedirectResponse
    {
        // Gunakan Redirector agar return type sesuai
        $redirector = app(Redirector::class);

        $user = Auth::user();

        if ($user) {
            // Cek environment agar bisa otomatis di production nanti
            if (app()->environment('production')) {
                return new RedirectResponse(url('/pos'));
            }

            // Saat development → arahkan ke React dev server
            return new RedirectResponse('http://127.0.0.1:5173');
        }

        // fallback jika tidak ada user
        return new RedirectResponse(url('/kasir/login'));
    }
}
