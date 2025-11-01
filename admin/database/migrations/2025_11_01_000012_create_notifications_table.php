<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        DB::statement('ALTER TABLE notifications ADD COLUMN data jsonb');
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
