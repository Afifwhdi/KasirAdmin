<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class PluDemoSeeder extends Seeder
{
    public function run(): void
    {
        Product::whereIn('name', [
            'Bawang Merah',
            'Bawang Putih',
            'Cabe Rawit'
        ])->update(['is_plu_enabled' => 1]);
    }
}