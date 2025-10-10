<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

class DebugRedis extends Command
{
    /**
     * Nama dan signature command.
     *
     * Contoh:
     * php artisan debug:redis
     * php artisan debug:redis laravel:*
     */
    protected $signature = 'debug:redis {pattern? : Pola key Redis (misal laravel:*)}';

    protected $description = 'Debug isi Redis berdasarkan pola key tertentu';

    public function handle(): int
    {
        $pattern = $this->argument('pattern') ?? '*';
        $keys = Redis::keys($pattern);

        if (empty($keys)) {
            $this->warn("Tidak ada key Redis yang cocok dengan pola: {$pattern}");
            return self::SUCCESS;
        }

        $rows = [];
        foreach ($keys as $key) {
            $value = Redis::get($key);
            if (is_string($value) && strlen($value) > 50) {
                $value = substr($value, 0, 47) . '...';
            }
            $rows[] = [$key, $value];
        }

        $this->table(['Key', 'Value'], $rows);

        return self::SUCCESS;
    }
}
