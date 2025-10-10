<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'barcode')) {
                $table->string('barcode', 191)->nullable()->change();
                $table->unique('barcode', 'products_barcode_unique');
            }
            if (Schema::hasColumn('products', 'sku')) {
                $table->string('sku', 191)->nullable()->change();
                $table->unique('sku', 'products_sku_unique');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'barcode')) {
                $table->dropUnique('products_barcode_unique');
            }
            if (Schema::hasColumn('products', 'sku')) {
                $table->dropUnique('products_sku_unique');
            }
        });
    }
};
