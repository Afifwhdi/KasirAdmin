<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ReceiptTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'header_text',
        'footer_text',
        'logo_path',
        'paper_width',
        'font_size',
        'show_logo',
        'show_barcode',
        'show_tax',
        'is_active',
        'is_default',
    ];

    protected $casts = [
        'show_logo' => 'boolean',
        'show_barcode' => 'boolean',
        'show_tax' => 'boolean',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
    ];
    
    protected static function booted()
    {
        // Ensure only one default template
        static::saving(function ($template) {
            if ($template->is_default) {
                static::where('id', '!=', $template->id)
                    ->update(['is_default' => false]);
            }
        });
    }
}
