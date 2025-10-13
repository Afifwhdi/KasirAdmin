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
        // Drop unused columns from transactions
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['email', 'phone', 'address', 'notes']);
        });

        // Drop description from products
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add back columns if needed to rollback
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('email')->nullable()->after('name');
            $table->string('phone')->nullable()->after('email');
            $table->text('address')->nullable()->after('phone');
            $table->text('notes')->nullable()->after('address');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->text('description')->nullable()->after('is_plu_enabled');
        });
    }
};
