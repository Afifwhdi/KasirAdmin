<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaction_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->decimal('quantity', 10, 2);
            $table->integer('price');
            $table->integer('cost_price');
            $table->integer('total_profit');
            $table->timestamps();
            $table->string('product_name_snapshot')->nullable();
            $table->integer('subtotal')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_items');
    }
};
