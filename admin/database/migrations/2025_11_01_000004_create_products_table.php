<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->decimal('stock', 10, 2)->default(0);
            $table->integer('cost_price');
            $table->integer('price');
            $table->string('image')->nullable();
            $table->string('sku')->nullable()->unique();
            $table->string('barcode')->nullable()->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('version')->default(1);
            $table->integer('min_stock')->default(10);
            $table->boolean('is_plu_enabled')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
