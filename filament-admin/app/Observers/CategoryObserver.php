<?php

namespace App\Observers;

use App\Models\Category;
use Illuminate\Support\Facades\Cache;

class CategoryObserver
{
    public function created(Category $category): void
    {
        $this->clearCache();
    }

    public function updated(Category $category): void
    {
        $this->clearCache();
    }

    public function deleted(Category $category): void
    {
        $category->products()->delete();
        $this->clearCache();
    }

    public function restored(Category $category): void
    {
        $category->products()->restore();
        $this->clearCache();
    }

    public function forceDeleted(Category $category): void
    {
        $category->products()->forceDelete();
        $this->clearCache();
    }

    private function clearCache(): void
    {
        try {
            Cache::tags(['products', 'categories'])->flush();
        } catch (\Exception $e) {
            Cache::forget('products:all');
            Cache::forget('categories:all');
        }
    }
}
