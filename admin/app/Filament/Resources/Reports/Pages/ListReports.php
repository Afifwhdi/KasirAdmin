<?php

namespace App\Filament\Resources\Reports\Pages;

use App\Filament\Resources\Reports\ReportResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;
use Illuminate\Support\Carbon;

class ListReports extends ListRecords
{
    protected static string $resource = ReportResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make()
                ->mutateFormDataUsing(function (array $data) {
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
                }),
        ];
    }
}
