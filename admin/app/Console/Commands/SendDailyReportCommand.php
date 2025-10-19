<?php

namespace App\Console\Commands;

use App\Jobs\SendDailyReportJob;
use Illuminate\Console\Command;

class SendDailyReportCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'report:daily';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send daily sales report via WhatsApp';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Sending daily report...');

        try {
            SendDailyReportJob::dispatch();
            $this->info('Daily report job dispatched successfully!');
        } catch (\Exception $e) {
            $this->error('Failed to dispatch daily report job: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
