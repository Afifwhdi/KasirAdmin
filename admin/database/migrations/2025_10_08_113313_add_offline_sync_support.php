<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('transactions', 'uuid')) {
                $table->char('uuid', 36)->after('id');
            }
            if (!Schema::hasColumn('transactions', 'is_synced')) {
                $table->boolean('is_synced')->default(true)->after('uuid');
            }
            if (!Schema::hasColumn('transactions', 'synced_at')) {
                $table->timestamp('synced_at')->nullable()->after('is_synced');
            }

            $table->index('uuid');
            $table->index('is_synced');
        });

        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'version')) {
                $table->unsignedBigInteger('version')->default(1)->after('updated_at');
                $table->index('version');
            }
        });

        Schema::table('categories', function (Blueprint $table) {
            if (!Schema::hasColumn('categories', 'version')) {
                $table->unsignedBigInteger('version')->default(1)->after('updated_at');
            }
        });

        if (!Schema::hasTable('stock_movements')) {
            Schema::create('stock_movements', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('product_id');
                $table->enum('source', ['pos', 'admin'])->default('pos');
                $table->integer('change_qty');
                $table->char('reference_uuid', 36)->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->foreign('product_id')
                    ->references('id')
                    ->on('products')
                    ->onDelete('cascade');

                $table->index('product_id');
            });
        }

        if (!Schema::hasTable('sync_logs')) {
            Schema::create('sync_logs', function (Blueprint $table) {
                $table->id();
                $table->char('uuid', 36);
                $table->enum('type', ['download', 'upload']);
                $table->enum('status', ['success', 'failed']);
                $table->text('message')->nullable();
                $table->timestamp('created_at')->useCurrent();
            });
        }
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            if (Schema::hasColumn('transactions', 'uuid')) {
                $table->dropColumn('uuid');
            }
            if (Schema::hasColumn('transactions', 'is_synced')) {
                $table->dropColumn('is_synced');
            }
            if (Schema::hasColumn('transactions', 'synced_at')) {
                $table->dropColumn('synced_at');
            }
        });

        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'version')) {
                $table->dropColumn('version');
            }
        });

        Schema::table('categories', function (Blueprint $table) {
            if (Schema::hasColumn('categories', 'version')) {
                $table->dropColumn('version');
            }
        });

        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('sync_logs');
    }
};
