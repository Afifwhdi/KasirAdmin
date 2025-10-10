<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Penjualan</title>
    <style>
        body { margin:0 auto; font-family: Arial, sans-serif; font-size:12px; color:#001028; }
        header { padding:10px 0; text-align:center; border-bottom:1px solid #5D6975; margin-bottom:20px; }
        h1 { font-size:20px; margin:10px 0 4px; }
        .sub { font-size:12px; color:#5D6975; }
        table { width:100%; border-collapse: collapse; margin-top:10px; }
        th, td { border:1px solid #ccc; padding:6px 8px; }
        th { background:#f3f3f3; text-align:left; }
        .right { text-align:right; }
        .center { text-align:center; }
        tfoot td { font-weight:bold; }
        .note { margin-top:10px; font-size:11px; color:#444; }
    </style>
</head>
<body>
@php
    $fmtTanggal = fn($d)=> \Illuminate\Support\Carbon::parse($d)->isoFormat('DD MMMM YYYY');
    $rupiah     = fn($n)=> 'Rp '.number_format((float)$n,0,',','.');
    $totalQty = 0; $totalGrand = 0;
@endphp

<header>
    <h1>Laporan Penjualan</h1>
    <div class="sub">({{ $fileName }})</div>
</header>

<main>
    <table>
        <thead>
        <tr>
            <th style="width:18%">Tanggal</th>
            <th style="width:32%">No Transaksi</th>
            <th style="width:10%" class="right">Qty</th>
            <th style="width:20%" class="right">Subtotal</th>
            <th style="width:20%" class="right">Grand Total</th>
        </tr>
        </thead>
        <tbody>
        @forelse($data as $trx)
            @php
                // Hitung dari relasi items (quantity & price)
                $qty = (int) ($trx->transactionItems->sum('quantity'));
                $sub = (float) ($trx->transactionItems->sum(fn($i)=> $i->quantity * $i->price));
                $grand = (float) ($trx->total ?? $sub);

                $totalQty += $qty;
                $totalGrand += $grand;
            @endphp
            <tr>
                <td>{{ $fmtTanggal($trx->created_at) }}</td>
                <td>{{ $trx->transaction_number }}</td>
                <td class="right">{{ $qty }}</td>
                <td class="right">{{ $rupiah($sub) }}</td>
                <td class="right">{{ $rupiah($grand) }}</td>
            </tr>
        @empty
            <tr><td class="center" colspan="5">Tidak ada data pada rentang tanggal ini</td></tr>
        @endforelse
        </tbody>
        <tfoot>
        <tr>
            <td colspan="2" class="right">Total</td>
            <td class="right">{{ $totalQty }}</td>
            <td></td>
            <td class="right">{{ $rupiah($totalGrand) }}</td>
        </tr>
        </tfoot>
    </table>

    <p class="note">Laporan ini dihasilkan secara otomatis tanpa tanda tangan.</p>
</main>
</body>
</html>
