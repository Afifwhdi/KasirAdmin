<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_method_id')->constrained();
            $table->string('transaction_number')->unique();
            $table->string('name')->nullable();
            $table->integer('total');
            $table->integer('cash_received');
            $table->integer('change_amount');
            $table->timestamps();
            $table->softDeletes();
            $table->string('status')->default('paid');
        });

        DB::statement("ALTER TABLE transactions ADD CONSTRAINT transactions_status_check CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
