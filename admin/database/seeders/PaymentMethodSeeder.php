<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('payment_methods')->insert([
            [
                'name' => 'Cash',
                'image' => null,
                'is_cash' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'QRIS',
                'image' => null,
                'is_cash' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}
