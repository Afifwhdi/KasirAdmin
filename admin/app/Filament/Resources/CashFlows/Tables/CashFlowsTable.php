<?php

namespace App\Filament\Resources\CashFlows\Tables;

use App\Services\CashFlowLabelService;
use Carbon\Carbon;
use Filament\Forms;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class CashFlowsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('date')
                    ->date('d F Y')
                    ->sortable(),

                Tables\Columns\BadgeColumn::make('type')
                    ->formatStateUsing(fn ($state) => CashFlowLabelService::getTypeLabel($state))
                    ->colors([
                        'success' => CashFlowLabelService::TYPE_INCOME,
                        'danger' => CashFlowLabelService::TYPE_EXPENSE,
                    ])
                    ->icon(fn (string $state): string => match ($state) {
                        CashFlowLabelService::TYPE_INCOME => 'heroicon-o-arrow-down-circle',
                        CashFlowLabelService::TYPE_EXPENSE => 'heroicon-o-arrow-up-circle',
                    }),

                Tables\Columns\TextColumn::make('source')
                    ->formatStateUsing(fn ($state, $record) => CashFlowLabelService::getSourceLabel($record->type, $state))
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('amount')
                    ->prefix('Rp ')
                    ->numeric()
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
            ->filters([
                Tables\Filters\Filter::make('range_date')
                    ->form([
                        Forms\Components\DatePicker::make('start_date')
                            ->label('Dari Tanggal'),
                        Forms\Components\DatePicker::make('end_date')
                            ->label('Sampai Tanggal'),
                    ])
                    ->query(function (Builder $query, array $data) {
                        return $query
                            ->when($data['start_date'], fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
                            ->when($data['end_date'], fn ($query, $date) => $query->whereDate('created_at', '<=', $date));
                    })
                    ->indicateUsing(fn (array $data): ?string => $data['start_date'] ? 'Dari '.Carbon::parse($data['start_date'])->toFormattedDateString().($data['end_date'] ? ' Sampai '.Carbon::parse($data['end_date'])->toFormattedDateString() : '')
                        : ($data['end_date'] ? 'Sampai '.Carbon::parse($data['end_date'])->toFormattedDateString() : null)),

                Tables\Filters\Filter::make('SourceTipe')
                    ->form([
                        Forms\Components\Select::make('type')
                            ->label('Tipe')
                            ->options(CashFlowLabelService::getTypes())
                            ->placeholder('Semua Tipe'),
                        Forms\Components\Select::make('source')
                            ->label('Sumber')
                            ->options(fn (Forms\Get $get) => CashFlowLabelService::getSourceOptionsByType($get('type')))
                            ->placeholder('Semua Sumber')
                            ->disabled(fn (Forms\Get $get) => empty($get('type'))),
                    ])
                    ->query(function (Builder $query, array $data) {
                        $type = $data['type'] ?? null;
                        $source = $data['source'] ?? null;
                        if (empty($type)) {
                            return $query;
                        }
                        $query->where('type', $type);
                        if (! empty($source)) {
                            $query->where('source', $source);
                        }

                        return $query;
                    })
                    ->indicateUsing(
                        fn (array $data): ?string => ($data['type'] ? 'Tipe: '.CashFlowLabelService::getTypeLabel($data['type']) : null).
                            ($data['source'] ? ', Sumber: '.CashFlowLabelService::getSourceLabel($data['type'], $data['source']) : '')
                    ),
            ], layout: Tables\Enums\FiltersLayout::Modal)
            ->actions([
                Tables\Actions\EditAction::make()
                    ->visible(
                        fn ($record) => $record->source !== 'sales' &&
                            $record->source !== 'adjustment' &&
                            $record->source !== 'restored_sales' &&
                            $record->source !== 'refund' &&
                            $record->source !== 'purchase_stock'
                    ),
            ])
            ->emptyStateIcon('heroicon-o-banknotes')
            ->emptyStateHeading('Belum ada laporan kas')
            ->emptyStateDescription('Semua laporan kas yang kamu input akan tampil di sini.')
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }
}
