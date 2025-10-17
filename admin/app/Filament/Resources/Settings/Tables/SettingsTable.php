<?php

namespace App\Filament\Resources\Settings\Tables;

use Filament\Actions;
use Filament\Tables;
use Filament\Tables\Table;

class SettingsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('logo')
                    ->circular()
                    ->label('Logo Toko'),

                Tables\Columns\TextColumn::make('name')
                    ->label('Nama Toko')
                    ->searchable(),

                Tables\Columns\TextColumn::make('address')
                    ->label('Alamat Toko')
                    ->searchable(),

                Tables\Columns\TextColumn::make('phone')
                    ->label('Nomor Telepon')
                    ->searchable(),

                Tables\Columns\IconColumn::make('print_via_bluetooth')
                    ->label('Print Via Bluetooth')
                    ->boolean(),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->actions([
                Actions\EditAction::make(),
            ])
            ->bulkActions([
                Actions\BulkActionGroup::make([
                    Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }
}
