<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

class RedisCleanupCommand extends Command
{
    /**
     * Nama command
     */
    protected $signature = 'redis:cleanup';

    protected $description = 'Bersihkan key Redis Laravel yang sudah tidak terpakai';

    public function handle(): int
    {
        $patterns = [
            'laravel:cache:*',
            'laravel:queues:*',
            'laravel:database:*',
            'laravel:sessions:*',
        ];

        $deleted = 0;

        foreach ($patterns as $pattern) {
            $keys = Redis::keys($pattern);

            if (!empty($keys)) {
                Redis::del($keys);
                $deleted += count($keys);
                $this->info("Deleted " . count($keys) . " keys for pattern {$pattern}");
            }
        }

        if ($deleted === 0) {
            $this->info("Tidak ada key yang perlu dibersihkan.");
        } else {
            $this->info("Total {$deleted} keys dihapus dari Redis.");
        }

        return Command::SUCCESS;
    }
}
