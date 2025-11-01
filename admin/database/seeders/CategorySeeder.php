<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        
        $now = Carbon::now();

        DB::table('categories')->insert([
            [
                'id' => 1,
                'name' => 'Makanan Ringan',
                'version' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'id' => 2,
                'name' => 'Minuman',
                'version' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'id' => 3,
                'name' => 'Alat Tulis Kantor (ATK)',
                'version' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'id' => 4,
                'name' => 'Produk Kebersihan',
                'version' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ],
        ]);

    }
}