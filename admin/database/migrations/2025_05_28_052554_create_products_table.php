<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->decimal('stock', 10, 2)->default(0);
            $table->integer('min_stock')->default(0);
            $table->integer('cost_price')->default(0);
            $table->integer('price')->default(0);
            $table->string('image')->nullable();
            $table->string('sku', 191)->nullable()->unique();
            $table->string('barcode', 191)->nullable()->unique();
            $table->boolean('is_plu_enabled')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
