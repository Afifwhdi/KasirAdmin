<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReportDownloadController;

Route::get('/', function () {
    return redirect('/admin/login');
});

Route::middleware(['auth'])
    ->get('/reports/{report}/download', [ReportDownloadController::class, 'download'])
    ->name('reports.download');
