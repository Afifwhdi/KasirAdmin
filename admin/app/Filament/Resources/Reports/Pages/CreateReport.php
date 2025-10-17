<?php

namespace App\Filament\Resources\Reports\Pages;

use App\Filament\Resources\Reports\ReportResource;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Carbon;

class CreateReport extends CreateRecord
{
    protected static string $resource = ReportResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $start = Carbon::parse($data['start_date']);
        $end   = Carbon::parse($data['end_date']);
        $type  = $data['report_type'] ?? 'inflow';

        $label = match ($type) {
            'inflow'  => 'Uang Masuk',
            'outflow' => 'Uang Keluar',
            'sales'   => 'Penjualan',
            default   => 'Laporan',
        };

        $data['name'] = sprintf('%s %s s.d. %s', $label, $start->toDateString(), $end->toDateString());

        $data['path_file'] = '';

        return $data;
    }
}
