<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class FixTransactionDuplicate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fix:transaction-duplicate {--dry-run : Run without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix duplicate transaction issue by adding unique constraint to API database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Starting transaction duplicate fix...');
        
        // API database connection details
        $apiDbConfig = [
            'host' => env('API_DB_HOST', '127.0.0.1'),
            'port' => env('API_DB_PORT', 5432),
            'database' => env('API_DB_DATABASE', 'kasir_dev'),
            'username' => env('API_DB_USERNAME', 'postgres'),
            'password' => env('API_DB_PASSWORD', 'root'),
        ];
        
        try {
            // Configure API database connection
            config(['database.connections.api_postgres' => [
                'driver' => 'pgsql',
                'host' => $apiDbConfig['host'],
                'port' => $apiDbConfig['port'],
                'database' => $apiDbConfig['database'],
                'username' => $apiDbConfig['username'],
                'password' => $apiDbConfig['password'],
                'charset' => 'utf8',
                'prefix' => '',
                'prefix_indexes' => true,
                'schema' => 'public',
                'sslmode' => 'prefer',
            ]]);
            
            $this->info('✅ Connected to API database');
            
            // Check current duplicates
            $this->info('🔍 Checking for existing duplicates...');
            $duplicates = DB::connection('api_postgres')
                ->select("
                    SELECT transaction_number, COUNT(*) as count 
                    FROM transactions 
                    GROUP BY transaction_number 
                    HAVING COUNT(*) > 1
                    ORDER BY count DESC
                ");
            
            if (count($duplicates) > 0) {
                $this->warn('⚠️  Found ' . count($duplicates) . ' duplicate transaction numbers:');
                foreach ($duplicates as $dup) {
                    $this->line("   - {$dup->transaction_number}: {$dup->count} records");
                }
                
                if (!$this->option('dry-run')) {
                    if ($this->confirm('Remove duplicates (keep first occurrence)?')) {
                        $this->info('🗑️  Removing duplicates...');
                        $deleted = DB::connection('api_postgres')
                            ->delete("
                                DELETE FROM transactions 
                                WHERE id IN (
                                    SELECT id FROM (
                                        SELECT id,
                                               ROW_NUMBER() OVER (PARTITION BY transaction_number ORDER BY id) as rn
                                        FROM transactions
                                    ) t
                                    WHERE t.rn > 1
                                )
                            ");
                        $this->info("✅ Deleted {$deleted} duplicate records");
                    }
                }
            } else {
                $this->info('✅ No duplicates found');
            }
            
            // Check if unique constraint exists
            $this->info('🔍 Checking for unique constraint...');
            $constraint = DB::connection('api_postgres')
                ->select("
                    SELECT conname, contype 
                    FROM pg_constraint 
                    WHERE conrelid = 'transactions'::regclass 
                    AND conname = 'uk_transactions_transaction_number'
                ");
            
            if (empty($constraint)) {
                if (!$this->option('dry-run')) {
                    if ($this->confirm('Add unique constraint to transaction_number?')) {
                        $this->info('🔧 Adding unique constraint...');
                        DB::connection('api_postgres')
                            ->statement("
                                ALTER TABLE transactions 
                                ADD CONSTRAINT uk_transactions_transaction_number 
                                UNIQUE (transaction_number)
                            ");
                        $this->info('✅ Unique constraint added successfully');
                    }
                } else {
                    $this->info('📋 [DRY RUN] Would add unique constraint');
                }
            } else {
                $this->info('✅ Unique constraint already exists');
            }
            
            // Test API endpoint with duplicate data
            $this->info('🧪 Testing API duplicate prevention...');
            $apiBaseUrl = env('API_BASE_URL', 'http://154.19.37.167:3000');
            
            $testTransaction = [
                'transaction_number' => 'TEST-DUPLICATE-' . time(),
                'name' => 'Test Customer',
                'payment_method_id' => 1,
                'total' => 10000,
                'cash_received' => 10000,
                'change_amount' => 0,
                'status' => 'paid',
                'items' => [[
                    'product_id' => 1,
                    'product_name_snapshot' => 'Test Product',
                    'quantity' => 1,
                    'price' => 10000,
                    'subtotal' => 10000,
                    'cost_price' => 5000,
                    'total_profit' => 5000,
                ]]
            ];
            
            if (!$this->option('dry-run')) {
                // Send first request
                $response1 = Http::post("{$apiBaseUrl}/transactions", $testTransaction);
                if ($response1->successful()) {
                    $this->info('✅ First transaction created successfully');
                    
                    // Send duplicate request
                    $testTransaction['cash_received'] = 15000;
                    $testTransaction['change_amount'] = 5000;
                    $response2 = Http::post("{$apiBaseUrl}/transactions", $testTransaction);
                    
                    if ($response2->successful()) {
                        $data = $response2->json();
                        if (isset($data['data']['updated']) && $data['data']['updated']) {
                            $this->info('✅ Second request updated existing transaction (no duplicate)');
                        } else {
                            $this->info('✅ Second request treated as new transaction');
                        }
                    } else {
                        $this->error('❌ Second API request failed: ' . $response2->body());
                    }
                } else {
                    $this->error('❌ First API request failed: ' . $response1->body());
                }
            }
            
            $this->info('🎉 Transaction duplicate fix completed!');
            $this->newLine();
            $this->info('Next steps:');
            $this->line('1. Restart your API server (cd ../api && npm run start:dev)');
            $this->line('2. Test BON workflow: Create -> Sync -> Pay -> Sync');
            $this->line('3. Verify no duplicates in database');
            
        } catch (\Exception $e) {
            $this->error('❌ Error: ' . $e->getMessage());
            return 1;
        }
        
        return 0;
    }
}
