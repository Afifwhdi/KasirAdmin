<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('transactions')) {
            return;
        }

        if (Schema::hasColumn('transactions', 'idempotency_key')) {
            return;
        }

        Schema::table('transactions', function (Blueprint $table) {
            $table->string('idempotency_key', 100)->nullable()->unique();
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('transactions') && Schema::hasColumn('transactions', 'idempotency_key')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->dropColumn('idempotency_key');
            });
        }
    }
};
