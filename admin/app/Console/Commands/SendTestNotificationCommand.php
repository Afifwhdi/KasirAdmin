<?php

namespace App\Console\Commands;

use App\Models\User;
use Filament\Notifications\Notification;
use Illuminate\Console\Command;

class SendTestNotificationCommand extends Command
{
    protected $signature = 'notification:test {user_id?}';
    protected $description = 'Send test notification to admin';

    public function handle()
    {
        $userId = $this->argument('user_id');

        if ($userId) {
            $user = User::find($userId);
            if (!$user) {
                $this->error("User with ID {$userId} not found!");
                return 1;
            }
        } else {
            $user = User::where('role', 'admin')->first();
            if (!$user) {
                $this->error("No admin user found!");
                return 1;
            }
        }

        Notification::make()
            ->title('Notifikasi Test')
            ->body('Ini adalah notifikasi test dari sistem kasir. Fitur notifikasi berhasil aktif! 🎉')
            ->icon('heroicon-o-bell')
            ->success()
            ->sendToDatabase($user);

        $this->info("Test notification sent to {$user->name} ({$user->email})");
        return 0;
    }
}
