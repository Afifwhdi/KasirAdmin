<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReportDownloadController;

Route::get('/', function () {
    return redirect('/admin');
});

Route::middleware(['auth'])
    ->get('/reports/{report}/download', [ReportDownloadController::class, 'download'])
    ->name('reports.download');

// Temporary debug endpoint - REMOVE after checking
Route::get('/debug/db-check', function () {
    try {
        $connection = DB::connection()->getPdo();
        $config = [
            'driver' => config('database.default'),
            'host' => config('database.connections.pgsql.host'),
            'port' => config('database.connections.pgsql.port'),
            'database' => config('database.connections.pgsql.database'),
            'username' => config('database.connections.pgsql.username'),
        ];
        $tables = DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
        $userCount = DB::table('users')->count();
        $users = DB::table('users')->select('id', 'email', 'username', 'role')->get();
        
        return response()->json([
            'status' => 'success',
            'config' => $config,
            'tables_count' => count($tables),
            'tables' => collect($tables)->pluck('tablename'),
            'users_count' => $userCount,
            'users' => $users,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
        ], 500);
    }
});
