<?php

use App\Jobs\SendDailyReportJob;
use App\Models\NotificationSetting;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule Daily Report based on notification settings
Schedule::call(function () {
    $setting = NotificationSetting::where('is_active', true)->first();
    
    if ($setting && $setting->send_time) {
        $sendTime = \Carbon\Carbon::parse($setting->send_time)->format('H:i');
        $now = now()->format('H:i');
        
        if ($sendTime === $now) {
            SendDailyReportJob::dispatch();
        }
    }
})->everyMinute()->name('check-daily-report-schedule');
