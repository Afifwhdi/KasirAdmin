<?php

namespace App\Console\Commands;

use App\Models\Category;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SeedCategoriesCommand extends Command
{
    protected $signature = 'categories:seed {--force : Force seed in production}';

    protected $description = 'Seed predefined categories for product import';

    protected $categories = [
        'Bahan Kue & Dessert',
        'Bumbu & Rempah',
        'Kebutuhan Rumah Tangga',
        'Lainnya',
        'Makanan Instan',
        'Minuman',
        'Obat-obatan',
        'Perawatan Tubuh & Kecantikan',
        'Perlengkapan Bayi',
        'Rokok & Tembakau',
        'Snack & Makanan Ringan',
    ];

    public function handle()
    {
        $env = app()->environment();
        $db = DB::connection()->getDatabaseName();

        $this->info('=================================');
        $this->info('📦 SEEDING CATEGORIES');
        $this->info('=================================');
        $this->line("Environment: {$env}");
        $this->line("Database: {$db}");
        $this->newLine();

        if ($env === 'production' && !$this->option('force')) {
            $this->error('⚠️  Production environment detected!');
            $this->warn('Use --force flag to proceed: php artisan categories:seed --force');
            return 1;
        }

        if (!$this->confirm('Seed ' . count($this->categories) . ' categories?', true)) {
            $this->warn('❌ Cancelled.');
            return 0;
        }

        DB::beginTransaction();

        try {
            $created = 0;
            $existing = 0;

            $progressBar = $this->output->createProgressBar(count($this->categories));
            $progressBar->start();

            foreach ($this->categories as $name) {
                $category = Category::firstOrCreate(['name' => $name]);

                if ($category->wasRecentlyCreated) {
                    $created++;
                } else {
                    $existing++;
                }

                $progressBar->advance();
            }

            $progressBar->finish();
            $this->newLine(2);

            DB::commit();

            $this->info('=================================');
            $this->info('📊 SUMMARY');
            $this->info('=================================');
            $this->line("✅ Created: {$created}");
            $this->line("ℹ️  Already exists: {$existing}");
            $this->line("📦 Total in DB: " . Category::count());
            $this->newLine();
            $this->info('✅ Categories seeded successfully!');
            $this->info('✅ Ready to import products.');

            return 0;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->newLine(2);
            $this->error('=================================');
            $this->error('❌ ERROR');
            $this->error('=================================');
            $this->error($e->getMessage());
            $this->error('❌ Transaction rolled back.');

            return 1;
        }
    }
}
