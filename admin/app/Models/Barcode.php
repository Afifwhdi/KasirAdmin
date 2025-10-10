<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Barcode extends Model
{
    protected $fillable = ['code', 'product_id', 'preset_qty', 'lock_count'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
