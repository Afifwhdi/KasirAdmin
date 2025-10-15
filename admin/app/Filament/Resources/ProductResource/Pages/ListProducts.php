<?php

namespace App\Filament\Resources\ProductResource\Pages;

use Filament\Actions;
use App\Models\Product;
use Filament\Actions\Action;
use App\Imports\ProductsImport;
use Maatwebsite\Excel\Facades\Excel;
use Filament\Resources\Components\Tab;
use Filament\Notifications\Notification;
use Filament\Forms\Components\FileUpload;
use Filament\Resources\Pages\ListRecords;
use Illuminate\Database\Eloquent\Builder;
use App\Filament\Resources\ProductResource;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Category;
use Milon\Barcode\DNS1D;

class ListProducts extends ListRecords
{
    protected static string $resource = ProductResource::class;

    protected function getHeaderActions(): array
    {
        return [

                Actions\Action::make('printAllNonBarcode')
                ->label('cetak non-barcode')
                ->icon('heroicon-o-printer')
                ->color('primary')
                ->action(function () {
                    $items = Product::query()
                        ->where('is_plu_enabled', true)
                        ->whereNotNull('barcode')
                        ->where('barcode', '!=', '')
                        ->orderBy('name')
                        ->get();

                    if ($items->isEmpty()) {
                        Notification::make()
                            ->title('Tidak ada produk non-barcode dengan barcode.')
                            ->warning()
                            ->send();
                        return;
                    }

                    $generator = new \Milon\Barcode\DNS1D();

                    $barcodes = [];
                    foreach ($items as $p) {
                        $pngData = $generator->getBarcodePNG($p->barcode, 'C128', 2, 60);
                        $barcodes[] = [
                            'number'  => $p->barcode,
                            'name'    => $p->name,
                            'price'   => (int) $p->price,
                            'barcode' => 'data:image/png;base64,' . $pngData,
                        ];
                    }

                    $pdf = Pdf::loadView('pdf.barcodes.barcode', [
                        'barcodes' => $barcodes,
                    ])->setPaper('a4', 'portrait');

                    return response()->streamDownload(
                        fn () => print($pdf->output()),
                        'barcodes-non-barcode-' . now()->format('YmdHis') . '.pdf'
                    );
                }),

            Actions\CreateAction::make()->label('Tambah'),

            Action::make('importCsv')
                ->label('Import CSV')
                ->icon('heroicon-o-arrow-up-tray')
                ->color('success')
                ->form([
                    FileUpload::make('file')
                        ->label('File CSV')
                        ->helperText('Format: nama_produk, kategori, harga_modal, harga_jual, stok, min_stok, barcode, aktif, kiloan')
                        ->disk('local')              
                        ->directory('imports')      
                        ->maxSize(10240)             
                        ->acceptedFileTypes(['text/csv', 'text/plain', 'application/vnd.ms-excel', 'application/csv'])
                        ->required(),
                ])
                ->action(function (array $data) {
                    try {
                        $uploaded = $data['file'];
                        $import = new ProductsImport();

                        // Handle uploaded file
                        if (is_object($uploaded) && (
                                is_a($uploaded, \Illuminate\Http\UploadedFile::class) ||
                                class_exists('\Livewire\Features\SupportFileUploads\TemporaryUploadedFile') &&
                                is_a($uploaded, \Livewire\Features\SupportFileUploads\TemporaryUploadedFile::class)
                            )) {
                            Excel::import($import, $uploaded);
                        } elseif (is_string($uploaded)) {
                            $fullPath = Storage::disk('local')->path(ltrim($uploaded, '/'));
                            if (! file_exists($fullPath)) {
                                throw new \RuntimeException('File tidak ditemukan: ' . $fullPath);
                            }
                            Excel::import($import, $fullPath);
                        } else {
                            throw new \RuntimeException('Tipe data file tidak dikenali untuk import.');
                        }

                        // Get import summary
                        $summary = $import->getSummary();

                        // Show notification with summary
                        if ($summary['failed'] > 0) {
                            Notification::make()
                                ->title('Import selesai dengan error')
                                ->body("Berhasil: {$summary['success']}, Gagal: {$summary['failed']}")
                                ->warning()
                                ->duration(10000)
                                ->send();

                            // Log errors
                            foreach ($summary['errors'] as $error) {
                                logger()->warning('Import error: ' . $error);
                            }
                        } else {
                            Notification::make()
                                ->title('Import berhasil!')
                                ->body("{$summary['success']} produk berhasil diimport")
                                ->success()
                                ->send();
                        }

                        return;
                    } catch (\Throwable $e) {
                        Notification::make()
                            ->title('Import gagal')
                            ->body($e->getMessage())
                            ->danger()
                            ->send();
                        report($e);
                        throw $e;
                    }
                }),
        ];
    }


    public function getTabs(): array
    {

        $rokokId = Category::query()->where('name', 'Rokok')->value('id');

        return [
            'Semua' => Tab::make()
                ->modifyQueryUsing(fn (Builder $query) => $query)
                ->badge(Product::query()->count()),

            'Stock Banyak' => Tab::make()
                ->modifyQueryUsing(fn (Builder $query) => $query->where('stock', '>', 10))
                ->badge(Product::query()->where('stock', '>=', 10)->count())
                ->badgeColor('success'),

            'Stock Sedikit' => Tab::make()
                ->modifyQueryUsing(fn (Builder $query) => $query->where('stock', '<', 10)->where('stock', '>', 0))
                ->badge(Product::query()->where('stock', '<', 10)->where('stock', '>', 0)->count())
                ->badgeColor('warning'),

            'Stock Habis' => Tab::make()
                ->modifyQueryUsing(fn (Builder $query) => $query->where('stock', '=', 0))
                ->badge(Product::query()->where('stock', '<=', 0)->count())
                ->badgeColor('danger'),

            'Produk Non Barcode' => Tab::make()
                ->modifyQueryUsing(fn (Builder $query) => $query->where('is_plu_enabled', true))
                ->badge(Product::query()->where('is_plu_enabled', true)->count())
                ->badgeColor('gray'),

            'Rokok' => Tab::make()
                ->modifyQueryUsing(fn (Builder $query) => $query->where('category_id', $rokokId))
                ->badge(Product::query()->where('category_id', $rokokId)->count())
                ->badgeColor('success'),
        ];
    }
}
