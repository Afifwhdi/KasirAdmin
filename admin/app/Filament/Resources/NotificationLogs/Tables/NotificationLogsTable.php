<?php

namespace App\Filament\Resources\NotificationLogs\Tables;

use Filament\Tables\Columns\BadgeColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Actions\DeleteBulkAction;


class NotificationLogsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('receiver')
                    ->label('Penerima')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('message')
                    ->label('Pesan')
                    ->limit(50)
                    ->wrap()
                    ->searchable(),

                BadgeColumn::make('status')
                    ->label('Status')
                    ->colors([
                        'success' => 'success',
                        'danger' => 'failed',
                    ])
                    ->formatStateUsing(fn(string $state): string => match ($state) {
                        'success' => 'Berhasil',
                        'failed' => 'Gagal',
                        default => $state,
                    }),

                TextColumn::make('sent_at')
                    ->label('Waktu Kirim')
                    ->dateTime('d M Y, H:i')
                    ->sortable(),

                TextColumn::make('created_at')
                    ->label('Dibuat')
                    ->dateTime('d M Y, H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                //
            ])
            ->toolbarActions([
                DeleteBulkAction::make(),
            ])

            ->defaultSort('sent_at', 'desc');
    }
}
