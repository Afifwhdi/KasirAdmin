{{-- resources/views/filament/pos/view-transaction.blade.php --}}
<div class="bg-white shadow-md rounded-xl p-6 space-y-6">
    {{-- Header --}}
    <div class="flex justify-between items-center border-b pb-3">
        <h2 class="text-2xl font-bold text-gray-800">Detail Transaksi</h2>
        <span class="text-sm text-gray-500">
            {{ $record->created_at->format('d M Y H:i') }}
        </span>
    </div>

    {{-- Info Utama --}}
    <div class="grid grid-cols-2 gap-4 text-gray-700">
        <p><span class="font-semibold">ID Transaksi:</span> #{{ $record->id }}</p>
        <p><span class="font-semibold">Customer:</span> {{ $record->customer_name ?? 'Umum' }}</p>
        <p><span class="font-semibold">Metode Pembayaran:</span> {{ $record->payment_method->name ?? '-' }}</p>
        <p><span class="font-semibold">Kasir:</span> {{ $record->user->name ?? '-' }}</p>
    </div>

    {{-- Tabel Items --}}
    <div>
        <h3 class="text-lg font-semibold mb-3">Item Pesanan</h3>
        @if($record->items && $record->items->count())
        <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead class="bg-gray-100 text-gray-700">
                <tr>
                    <th class="p-2 border">Produk</th>
                    <th class="p-2 border text-center">Qty</th>
                    <th class="p-2 border text-right">Harga</th>
                    <th class="p-2 border text-right">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                @foreach($record->items as $item)
                <tr class="hover:bg-gray-50">
                    <td class="p-2 border">{{ $item->product->name ?? '-' }}</td>
                    <td class="p-2 border text-center">{{ $item->quantity }}</td>
                    <td class="p-2 border text-right">
                        Rp {{ number_format($item->price, 0, ',', '.') }}
                    </td>
                    <td class="p-2 border text-right">
                        Rp {{ number_format($item->price * $item->quantity, 0, ',', '.') }}
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <p class="text-gray-500 italic">Tidak ada item pada transaksi ini.</p>
        @endif
    </div>

    {{-- Total --}}
    <div class="flex justify-end items-center pt-4 border-t">
        <span class="text-lg font-semibold mr-4">Total:</span>
        <span class="text-2xl font-bold text-green-600">
            Rp {{ number_format($record->total, 0, ',', '.') }}
        </span>
    </div>
</div>