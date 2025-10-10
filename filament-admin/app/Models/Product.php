<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'name',
        'stock',
        'cost_price',
        'price',
        'image',
        'barcode',
        'sku',
        'description',
        'is_active',
        'is_plu_enabled',
        'version',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_plu_enabled' => 'boolean',
    ];

    protected static function booted()
    {
        static::creating(function ($p) {
            if (empty($p->sku)) {
                $p->sku = self::generateSku();
            }
        });

        static::updating(function ($p) {
            if ($p->isDirty('stock') || $p->isDirty('price')) {
                $p->version = $p->version + 1;
            }
        });
    }

    public static function generateSku(): string
    {
        do {
            $sku = 'SKU-' . Str::upper(Str::random(8));
        } while (self::where('sku', $sku)->exists());

        return $sku;
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function transactionItems()
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function adjustStock(int $changeQty, string $source = 'pos', ?string $referenceUuid = null)
    {
        $this->stock += $changeQty;
        $this->save();

        $this->stockMovements()->create([
            'change_qty' => $changeQty,
            'source' => $source,
            'reference_uuid' => $referenceUuid,
        ]);
    }
}
