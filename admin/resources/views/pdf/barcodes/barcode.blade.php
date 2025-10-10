<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Barcode Produk</title>
    <style>
        @page { margin: 20px 20px 30px 20px; }
        body { font-family: Arial, sans-serif; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        td {
            width: 20%;                
            padding: 10px;
            text-align: center;
            vertical-align: top;
            border: 1px solid #000;   
        }
        .name { font-size: 10px; font-weight: bold; margin: 4px 0 2px 0; }
        .price { font-size: 10px; margin: 0 0 6px 0; }
        .code { font-size: 10px; margin-top: 4px; letter-spacing: 1px; }
        img { width: 120px; height: 30px; }
        h2 { font-size: 14px; margin: 0 0 10px 0; text-align: center; }
    </style>
</head>
<body>
    <h2>Barcode Produk (Non-Barcode)</h2>

    <table>
        <tr>
        @foreach ($barcodes as $index => $b)
            <td>
                <div class="name">{{ $b['name'] }}</div>
                <div class="price">Rp. {{ number_format($b['price'], 0, ',', '.') }}</div>
                <img src="{{ $b['barcode'] }}" alt="{{ $b['number'] }}">
                <div class="code">{{ $b['number'] }}</div>
            </td>

            @if (($index + 1) % 5 == 0)
                </tr><tr>
            @endif
        @endforeach

        @php
            $mod = count($barcodes) % 5;
        @endphp
        @if ($mod !== 0)
            @for ($i = 0; $i < 5 - $mod; $i++)
                <td></td>
            @endfor
        @endif
        </tr>
    </table>
</body>
</html>
