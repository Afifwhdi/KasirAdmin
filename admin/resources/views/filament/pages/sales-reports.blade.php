<x-filament-panels::page>
    <div class="space-y-6">
        {{-- Filter Form --}}
        <x-filament::section>
            <x-slot name="heading">
                Filter Periode Laporan
            </x-slot>

            <form wire:submit="applyFilter">
                {{ $this->form }}

                <div class="mt-4">
                    <x-filament::button type="submit">
                        Terapkan Filter
                    </x-filament::button>
                </div>
            </form>
        </x-filament::section>

        {{-- Stats Cards --}}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <x-filament::card>
                <div class="space-y-2">
                    <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total Transaksi
                    </div>
                    <div class="text-3xl font-bold text-primary-600 dark:text-primary-400">
                        {{ number_format($stats['transactions'] ?? 0, 0, ',', '.') }}
                    </div>
                    <div class="text-xs text-gray-500">
                        transaksi berhasil
                    </div>
                </div>
            </x-filament::card>

            <x-filament::card>
                <div class="space-y-2">
                    <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total Pendapatan
                    </div>
                    <div class="text-3xl font-bold text-success-600 dark:text-success-400">
                        Rp {{ number_format($stats['revenue'] ?? 0, 0, ',', '.') }}
                    </div>
                    <div class="text-xs text-gray-500">
                        dari {{ number_format($stats['items'] ?? 0, 0, ',', '.') }} items terjual
                    </div>
                </div>
            </x-filament::card>

            <x-filament::card>
                <div class="space-y-2">
                    <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total Profit
                    </div>
                    <div class="text-3xl font-bold text-warning-600 dark:text-warning-400">
                        Rp {{ number_format($stats['profit'] ?? 0, 0, ',', '.') }}
                    </div>
                    <div class="text-xs text-gray-500">
                        modal: Rp {{ number_format($stats['cost'] ?? 0, 0, ',', '.') }}
                    </div>
                </div>
            </x-filament::card>

            <x-filament::card>
                <div class="space-y-2">
                    <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Rata-rata Transaksi
                    </div>
                    <div class="text-3xl font-bold text-info-600 dark:text-info-400">
                        Rp {{ number_format($stats['avg_transaction'] ?? 0, 0, ',', '.') }}
                    </div>
                    <div class="text-xs text-gray-500">
                        per transaksi
                    </div>
                </div>
            </x-filament::card>

            <x-filament::card>
                <div class="space-y-2">
                    <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Margin Keuntungan
                    </div>
                    <div class="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        @if(($stats['revenue'] ?? 0) > 0)
                            {{ number_format((($stats['profit'] ?? 0) / ($stats['revenue'] ?? 1)) * 100, 2, ',', '.') }}%
                        @else
                            0%
                        @endif
                    </div>
                    <div class="text-xs text-gray-500">
                        profit margin
                    </div>
                </div>
            </x-filament::card>

            <x-filament::card>
                <div class="space-y-2">
                    <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Periode
                    </div>
                    <div class="text-lg font-bold text-gray-700 dark:text-gray-300">
                        {{ \Carbon\Carbon::parse($startDate)->format('d M Y') }}
                    </div>
                    <div class="text-xs text-gray-500">
                        sampai {{ \Carbon\Carbon::parse($endDate)->format('d M Y') }}
                    </div>
                </div>
            </x-filament::card>
        </div>

        {{-- Info Section --}}
        <x-filament::section>
            <x-slot name="heading">
                Informasi
            </x-slot>

            <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>✅ <strong>Export Transaksi:</strong> Mengunduh laporan detail transaksi dalam format Excel</p>
                <p>✅ <strong>Export Produk:</strong> Mengunduh laporan analytics produk dengan profit per item</p>
                <p>📊 Data ditampilkan berdasarkan periode yang dipilih</p>
                <p>🔄 Klik "Terapkan Filter" untuk memperbarui statistik</p>
            </div>
        </x-filament::section>
    </div>
</x-filament-panels::page>
