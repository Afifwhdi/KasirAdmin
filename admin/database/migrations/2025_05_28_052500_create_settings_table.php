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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('Toko Maju Jaya');
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('logo')->nullable();
            $table->boolean('print_via_bluetooth')->default(true);
            $table->string('name_printer_local')->nullable();
            $table->timestamps();
        });

        // Insert default setting
        DB::table('settings')->insert([
            'id' => 1,
            'name' => 'Toko Maju Jaya',
            'phone' => '081234567890',
            'address' => 'Jl. Pahlawan No. 123, Kota Sejahtera',
            'print_via_bluetooth' => true,
            'name_printer_local' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
