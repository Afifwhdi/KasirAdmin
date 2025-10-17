<?php

namespace App\Filament\Resources;

use Filament\Forms;
use Filament\Tables;
use App\Models\Report;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Filament\Resources\Resource;
use App\Filament\Resources\ReportResource\Pages;
use Filament\Tables\Actions\Action;

class ReportResource extends Resource
{

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::count();
    }

    protected static ?string $model = Report::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-clipboard-document-list';

    protected static ?string $navigationLabel = 'Laporan Keuangan';

    protected static ?int $navigationSort = 6;

    protected static string | \UnitEnum | null $navigationGroup = 'Menejemen keuangan';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Forms\Components\Section::make('Setting Laporan')
                    ->schema([
                        Forms\Components\ToggleButtons::make('report_type')
                            ->options([
                                'inflow' => 'Uang Masuk',
                                'outflow' => 'Uang Keluar',
                                'sales'  => 'Penjualan',
                            ])
                            ->colors([
                                'inflow' => 'success',
                                'outflow' => 'danger',
                                'sales'  => 'info',
                            ])
                            ->default('inflow')
                            ->grouped(),
                        Forms\Components\DatePicker::make('start_date')
                            ->label('Dari Tanggal')
                            ->required(),
                        Forms\Components\DatePicker::make('end_date')
                            ->label('Sampai Tanggal')
                            ->required(),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Nama/Kode Laporan')
                    ->weight('semibold')
                    ->searchable(),
                Tables\Columns\TextColumn::make('report_type')
                    ->label('Tipe Laporan')
                    ->formatStateUsing(fn(string $state): string => match ($state) {
                        'inflow'  => 'Uang Masuk',
                        'outflow' => 'Uang Keluar',
                        'sales'   => 'Penjualan',
                        default   => 'Unknown',
                    })
                    ->icon(fn(string $state): string => match ($state) {
                        'inflow'  => 'heroicon-o-arrow-down-circle',
                        'outflow' => 'heroicon-o-arrow-up-circle',
                        'sales'   => 'heroicon-o-arrow-down-circle',
                    })
                    ->color(fn(string $state): string => match ($state) {
                        'inflow'  => 'success',
                        'outflow' => 'danger',
                        'sales'   => 'info',
                        default   => 'gray',
                    }),
                Tables\Columns\TextColumn::make('start_date')
                    ->label('Dari Tanggal')
                    ->date()
                    ->sortable(),
                Tables\Columns\TextColumn::make('end_date')
                    ->label('Sampai Tanggal')
                    ->date()
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([])
            ->actions([
                Action::make('download')
                    ->label('Download')
                    ->icon('heroicon-m-arrow-down-tray')
                    ->color('primary')
                    ->url(fn(Report $record) => route('reports.download', $record))
                    ->visible(fn() => true),
                Tables\Actions\EditAction::make(),
            ])
            ->emptyStateIcon('heroicon-o-banknotes')
            ->emptyStateHeading('Belum ada laporan keuangan')
            ->emptyStateDescription('Semua laporan keuangan yang kamu input akan tampil di sini.')
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListReports::route('/'),
        ];
    }
}
