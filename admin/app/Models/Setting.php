<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'address',
        'logo',
        'print_via_bluetooth',
        'name_printer_local',
    ];

    protected $casts = [
        'print_via_bluetooth' => 'boolean',
    ];

    /**
     * Get the singleton settings instance
     */
    public static function get()
    {
        return self::firstOrCreate(
            ['id' => 1],
            [
                'name' => 'Toko Maju Jaya',
                'phone' => '081234567890',
                'address' => 'Jl. Pahlawan No. 123',
                'print_via_bluetooth' => true,
            ]
        );
    }
}
