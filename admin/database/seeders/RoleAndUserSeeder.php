<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleAndUserSeeder extends Seeder
{
    public function run(): void
    {
        // Role Admin
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->syncPermissions(Permission::all());

        // Role POS
        $posRole = Role::firstOrCreate(['name' => 'pos']);
        $posRole->syncPermissions([
            'view_any_product',
            'view_category',
            'view_payment::method',
            'create_transaction',
            'view_any_transaction',
            '_PosPage', // Page POS di Filament
        ]);

        // User Admin / Owner
        $owner = User::firstOrCreate(
            ['email' => 'afifwahidi2@gmail.com'],
            [
                'name' => 'Owner',
                'password' => Hash::make('123'),
            ]
        );
        $owner->syncRoles([$adminRole]);

        // User Kasir / POS
        $kasir = User::firstOrCreate(
            ['email' => 'adminpos@gmail.com'],
            [
                'name' => 'Kasir POS',
                'password' => Hash::make('123'),
            ]
        );
        $kasir->syncRoles([$posRole]);
    }
}
