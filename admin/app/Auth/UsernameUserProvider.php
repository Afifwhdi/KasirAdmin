<?php

namespace App\Auth;

use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;

class UsernameUserProvider extends EloquentUserProvider
{
    /**
     * Retrieve a user by the given credentials.
     */
    public function retrieveByCredentials(array $credentials): ?Authenticatable
    {
        if (
            empty($credentials) ||
            (count($credentials) === 1 &&
                array_key_exists('password', $credentials))
        ) {
            return null;
        }

        $query = $this->newModelQuery();

        if (isset($credentials['email'])) {
            $query->where(function ($q) use ($credentials) {
                $q->where('username', $credentials['email'])
                    ->orWhere('email', $credentials['email']);
            });
        } else {
            foreach ($credentials as $key => $value) {
                if (!str_contains($key, 'password')) {
                    $query->where($key, $value);
                }
            }
        }

        return $query->first();
    }
}
