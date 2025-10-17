<?php

namespace Database\Seeders;

use App\Models\ReceiptTemplate;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ReceiptTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        ReceiptTemplate::create([
            'name' => 'Template Default',
            'header_text' => "TOKO ANDA\nJl. Alamat Lengkap\nTelp: 081234567890",
            'footer_text' => "Terima kasih atas kunjungan Anda\nBarang yang sudah dibeli tidak dapat dikembalikan\n\nKunjungi kami lagi!",
            'paper_width' => 80,
            'font_size' => 'normal',
            'show_logo' => false,
            'show_barcode' => true,
            'show_tax' => false,
            'is_active' => true,
            'is_default' => true,
        ]);
        
        ReceiptTemplate::create([
            'name' => 'Template Thermal 58mm',
            'header_text' => "TOKO ANDA\nJl. Alamat\nTelp: 08123456789",
            'footer_text' => "Terima kasih\nBarang dibeli tidak dapat dikembalikan",
            'paper_width' => 58,
            'font_size' => 'small',
            'show_logo' => false,
            'show_barcode' => true,
            'show_tax' => false,
            'is_active' => true,
            'is_default' => false,
        ]);
    }
}
