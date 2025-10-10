<?php

namespace App\Providers;

use App\Models\Report;
use App\Models\Product;
use App\Models\Category;
use App\Models\Inventory;
use Filament\Support\Assets\Js;
use App\Observers\ReportObserver;
use App\Observers\ProductObserver;
use App\Observers\CategoryObserver;
use App\Observers\InventoryObserver;
use Illuminate\Support\ServiceProvider;
use Filament\Support\Facades\FilamentAsset;

use App\Http\Responses\LoginResponse as CustomLoginResponse;
use Filament\Http\Responses\Auth\Contracts\LoginResponse as LoginResponseContract;
use App\Http\Responses\LoginResponse;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->register(\App\Providers\Filament\AdminPanelProvider::class);
        $this->app->register(\Milon\Barcode\BarcodeServiceProvider::class);
        $this->app->bind(LoginResponse::class, CustomLoginResponse::class);
        $this->app->bind(LoginResponseContract::class, LoginResponse::class);
    }

    /**
     * Bootstrap any application services.
     */

    public function boot(): void
    {
        Inventory::observe(InventoryObserver::class);
        Category::observe(CategoryObserver::class);
        Product::observe(ProductObserver::class);
        Report::observe(ReportObserver::class);

        FilamentAsset::register([
            Js::make('printer-thermal', asset('js/printer-thermal.js'))
        ]);
    }
}
