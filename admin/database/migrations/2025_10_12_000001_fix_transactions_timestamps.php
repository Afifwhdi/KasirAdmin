<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update all transactions with NULL created_at to use current timestamp
        DB::statement("
            UPDATE transactions 
            SET created_at = NOW(), updated_at = NOW() 
            WHERE created_at IS NULL OR updated_at IS NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No rollback needed
    }
};
