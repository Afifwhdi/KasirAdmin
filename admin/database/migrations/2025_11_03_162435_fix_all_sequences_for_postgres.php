<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'users',
            'categories',
            'products',
            'payment_methods',
            'transactions',
            'transaction_items',
            'reports',
            'receipt_templates',
            'notification_settings',
            'notification_logs',
            'notifications',
            'settings'
        ];

        foreach ($tables as $table) {
            $sequenceName = "{$table}_id_seq";
            
            $sequenceExists = DB::selectOne(
                "SELECT EXISTS (
                    SELECT 1 FROM pg_sequences 
                    WHERE schemaname = 'public' 
                    AND sequencename = ?
                )",
                [$sequenceName]
            );

            if ($sequenceExists->exists) {
                DB::statement("SELECT setval('{$sequenceName}', COALESCE((SELECT MAX(id) FROM {$table}), 1))");
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
