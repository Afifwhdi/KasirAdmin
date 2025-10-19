<?php

namespace Database\Seeders;

use App\Models\NotificationSetting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class NotificationSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        NotificationSetting::create([
            'receivers' => '6288287013223',
            'send_time' => '21:00:00',
            'is_active' => true,
            'top_limit' => 3,
        ]);
    }
}
