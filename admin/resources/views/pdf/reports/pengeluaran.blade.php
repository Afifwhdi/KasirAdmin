<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Uang Keluar</title>
    <style>
        body { margin:0 auto; font-family: Arial, sans-serif; font-size:12px; color:#001028; }
        header { padding:10px 0; text-align:center; border-bottom:1px solid #5D6975; margin-bottom:20px; }
        h1 { font-size:20px; margin:10px 0 4px; }
        .sub { font-size:12px; color:#5D6975; }
        table { width:100%; border-collapse: collapse; margin-top:10px; }
        th, td { border:1px solid #ccc; padding:6px 8px; }
        th { background:#f3f3f3; text-align:left; }
        tfoot td { font-weight:bold; }
        .right { text-align:right; }
        .center { text-align:center; }
        .note { margin-top:10px; font-size:11px; color:#444; }
    </style>
</head>
<body>
@php
    $fmtTanggal = fn($d)=> \Illuminate\Support\Carbon::parse($d)->isoFormat('DD MMMM YYYY');
    $rupiah = fn($n)=> 'Rp '.number_format((float)$n,0,',','.');
    $total = 0;
@endphp

<header>
    <h1>Laporan Uang Keluar</h1>
    <div class="sub">({{ $fileName }})</div>
</header>

<main>
    <table>
        <thead>
        <tr>
            <th style="width:18%">Tanggal</th>
            <th style="width:12%">Tipe</th>
            <th style="width:30%">Keperluan</th>
            <th style="width:20%" class="right">Total</th>
            <th style="width:20%">Catatan</th>
        </tr>
        </thead>
        <tbody>
        @forelse($data as $row)
            @php $total += (float)($row->amount ?? 0); @endphp
            <tr>
                <td>{{ $fmtTanggal($row->date ?? $row->created_at) }}</td>
                <td>{{ $row->type ?? 'outflow' }}</td>
                <td>{{ $row->destination ?? $row->for ?? '-' }}</td>
                <td class="right">{{ $rupiah($row->amount ?? 0) }}</td>
                <td>{{ $row->notes ?? '-' }}</td>
            </tr>
        @empty
            <tr><td class="center" colspan="5">Tidak ada data pada rentang tanggal ini</td></tr>
        @endforelse
        </tbody>
        <tfoot>
        <tr>
            <td colspan="3" class="right">Total Keseluruhan</td>
            <td class="right">{{ $rupiah($total) }}</td>
            <td></td>
        </tr>
        </tfoot>
    </table>

    <p class="note">Laporan ini dihasilkan secara otomatis tanpa tanda tangan.</p>
</main>
</body>
</html>
