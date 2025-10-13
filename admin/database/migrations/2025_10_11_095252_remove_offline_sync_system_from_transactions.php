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
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['uuid', 'is_synced', 'synced_at', 'idempotency_key']);
        });

        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('sync_logs');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->char('uuid', 36)->default('')->after('id');
            $table->tinyInteger('is_synced')->default(1)->after('uuid');
            $table->timestamp('synced_at')->nullable()->after('is_synced');
            $table->string('idempotency_key', 100)->nullable()->after('deleted_at');
        });

        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->enum('source', ['pos', 'admin'])->default('pos');
            $table->integer('change_qty');
            $table->char('reference_uuid', 36)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('sync_logs', function (Blueprint $table) {
            $table->id();
            $table->char('uuid', 36);
            $table->enum('type', ['download', 'upload']);
            $table->enum('status', ['success', 'failed']);
            $table->text('message')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }
};
