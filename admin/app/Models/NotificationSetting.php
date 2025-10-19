<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NotificationSetting extends Model
{
    protected $fillable = [
        'receivers',
        'send_time',
        'is_active',
        'top_limit',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'send_time' => 'datetime:H:i:s',
    ];

    public function logs(): HasMany
    {
        return $this->hasMany(NotificationLog::class);
    }

    public function getReceiversArrayAttribute(): array
    {
        if (empty($this->receivers)) {
            return [];
        }
        return array_filter(array_map('trim', explode(',', $this->receivers)));
    }
}
