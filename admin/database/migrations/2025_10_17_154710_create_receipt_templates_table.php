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
        Schema::create('receipt_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('header_text')->nullable();
            $table->text('footer_text')->nullable();
            $table->string('logo_path')->nullable();
            $table->integer('paper_width')->default(80); // mm
            $table->string('font_size')->default('normal'); // small, normal, large
            $table->boolean('show_logo')->default(true);
            $table->boolean('show_barcode')->default(true);
            $table->boolean('show_tax')->default(false);
            $table->boolean('is_active')->default(false);
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipt_templates');
    }
};
