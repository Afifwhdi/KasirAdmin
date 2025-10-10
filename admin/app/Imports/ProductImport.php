<?php

namespace App\Imports;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProductImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        $map = [
            'nama barang'       => 'name',
            'nama_barang'       => 'name',
            'kategori produk'   => 'category',
            'kategori_produk'   => 'category',
            'harga modal'       => 'cost_price',
            'harga_modal'       => 'cost_price',
            'harga jual'        => 'price',
            'harga_jual'        => 'price',
            'stok produk'       => 'stock',
            'stok_produk'       => 'stock',
            'sku'               => 'sku',
            'barcode'           => 'barcode',
        ];

        $norm = [];
        foreach ($row as $k => $v) {
            $key = Str::lower(trim((string)$k));
            if (isset($map[$key])) {
                $norm[$map[$key]] = is_string($v) ? trim($v) : $v;
            }
        }

        if (empty($norm['name'])) {
            return null;
        }

        $allowed = [
            'Sembako',
            'Bumbu & Rempah',
            'Makanan Instan',
            'Minuman',
            'Snack & Makanan Ringan',
            'Perlengkapan Bayi',
            'Kebutuhan Rumah Tangga',
            'Perawatan Tubuh & Kecantikan',
            'Lainnya',
        ];

        $categoryName = $norm['category'] ?? 'Lainnya';
        if (! in_array($categoryName, $allowed, true)) {
            $categoryName = 'Lainnya';
        }
        $category = Category::firstOrCreate(['name' => $categoryName]);

        $toInt = function ($x) {
            if ($x === null || $x === '') return 0;
            if (is_numeric($x)) return (int)$x;
            $num = preg_replace('/[^\d\-]/', '', (string)$x);
            return (int)($num === '' ? 0 : $num);
        };

        $barcode = $norm['barcode'] ?? null;
        $sku     = $norm['sku'] ?? null;

        $product = null;
        if ($barcode) $product = Product::where('barcode', $barcode)->first();
        if (!$product && $sku) $product = Product::where('sku', $sku)->first();

        $payload = [
            'category_id' => $category->id,
            'name'        => $norm['name'],
            'cost_price'  => array_key_exists('cost_price', $norm) ? $toInt($norm['cost_price']) : 0,
            'price'       => array_key_exists('price', $norm) ? $toInt($norm['price']) : 0,
            'stock'       => array_key_exists('stock', $norm) ? $toInt($norm['stock']) : 0,
            'sku'         => null,                  
            'barcode'     => $barcode ?: null,
            'description' => null,
            'is_active'   => true,
        ];

        if ($product) {
            unset($payload['sku']);                
            $product->fill($payload)->save();
            return $product;
        }

        return new Product($payload);
    }
}
