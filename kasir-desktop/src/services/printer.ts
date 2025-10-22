
export interface ReceiptData {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  transactionNumber: string;
  date: string;
  time: string;
  cashier: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  totalQty: number;
  subtotal: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: string;
}

export class PrinterService {
  private static ESC = "\x1B";
  private static GS = "\x1D";


  private static COMMANDS = {
    INIT: "\x1B\x40",
    ALIGN_LEFT: "\x1B\x61\x00",
    ALIGN_CENTER: "\x1B\x61\x01",
    ALIGN_RIGHT: "\x1B\x61\x02",
    BOLD_ON: "\x1B\x45\x01",
    BOLD_OFF: "\x1B\x45\x00",
    FONT_NORMAL: "\x1B\x21\x00",
    FONT_LARGE: "\x1B\x21\x10",
    FONT_DOUBLE: "\x1B\x21\x30",
    LINE_FEED: "\x0A",
    CUT_PAPER: "\x1D\x56\x00",
  };

  /**
   * Build thermal printer commands for receipt (Offline Template)
   * Optimized for 58mm printer (OKAY 58D) - 32 characters width
   */
  static buildReceiptCommands(data: ReceiptData): string {
    let commands = "";


    commands += this.COMMANDS.INIT;


    commands += this.COMMANDS.ALIGN_CENTER;
    commands += this.COMMANDS.FONT_LARGE;
    commands += this.COMMANDS.BOLD_ON;
    commands += "DILLA CELL" + this.COMMANDS.LINE_FEED;
    commands += this.COMMANDS.BOLD_OFF;
    commands += this.COMMANDS.FONT_NORMAL;
    commands += "Ngestikarya, waway karya," + this.COMMANDS.LINE_FEED;
    commands += "lampung timur" + this.COMMANDS.LINE_FEED;
    commands += "Telp: 088287013223" + this.COMMANDS.LINE_FEED;
    commands += this.line(32, "=") + this.COMMANDS.LINE_FEED;


    commands += this.COMMANDS.ALIGN_LEFT;
    commands += `${data.date}${this.pad("", 4)}Kasir` + this.COMMANDS.LINE_FEED;
    commands += `${data.time}${this.pad("", 0)}${data.cashier}` + this.COMMANDS.LINE_FEED;
    commands += `${data.customerName}` + this.COMMANDS.LINE_FEED;
    commands += `No.${data.transactionNumber}` + this.COMMANDS.LINE_FEED;
    commands += this.line(32, "-") + this.COMMANDS.LINE_FEED;


    data.items.forEach((item, index) => {

      const itemName = item.name.length > 28 ? item.name.substring(0, 28) : item.name;
      commands += `${index + 1}. ${itemName}` + this.COMMANDS.LINE_FEED;


      const qtyPriceShort = `${item.quantity} ${this.formatUnit(item)} x ${this.formatCurrencyShort(item.price)}`;
      const subtotalShort = this.formatCurrencyShort(item.subtotal);
      const spaces = 32 - qtyPriceShort.length - subtotalShort.length;
      commands +=
        `  ${qtyPriceShort}${this.pad("", Math.max(0, spaces))}${subtotalShort}` + this.COMMANDS.LINE_FEED;
    });

    commands += this.line(32, "-") + this.COMMANDS.LINE_FEED;


    commands += `Total QTY : ${data.totalQty}` + this.COMMANDS.LINE_FEED;
    commands += this.COMMANDS.LINE_FEED;


    commands +=
      this.lineTwoColumn("Sub Total", this.formatCurrencyShort(data.subtotal), 32) +
      this.COMMANDS.LINE_FEED;
    commands += this.COMMANDS.BOLD_ON;
    commands +=
      this.lineTwoColumn("Total", this.formatCurrencyShort(data.total), 32) + this.COMMANDS.LINE_FEED;
    commands += this.COMMANDS.BOLD_OFF;
    commands +=
      this.lineTwoColumn(
        `Bayar (${data.paymentMethod})`,
        this.formatCurrencyShort(data.amountPaid),
        32
      ) + this.COMMANDS.LINE_FEED;
    commands +=
      this.lineTwoColumn("Kembali", this.formatCurrencyShort(data.change), 32) + this.COMMANDS.LINE_FEED;


    commands += this.COMMANDS.LINE_FEED;
    commands += this.line(32, "=") + this.COMMANDS.LINE_FEED;
    commands += this.COMMANDS.ALIGN_CENTER;
    commands += "Terima kasih sudah" + this.COMMANDS.LINE_FEED;
    commands += "belanja di Dilla Store" + this.COMMANDS.LINE_FEED;
    commands += "Semoga puas dengan" + this.COMMANDS.LINE_FEED;
    commands += "layanan kami!" + this.COMMANDS.LINE_FEED;
    commands += "Hubungi: 088287013223" + this.COMMANDS.LINE_FEED;
    commands += this.COMMANDS.LINE_FEED;
    commands += this.COMMANDS.LINE_FEED;


    commands += this.COMMANDS.CUT_PAPER;

    return commands;
  }

  /**
   * Print receipt using Web Bluetooth API
   */
  static async printViaBluetooth(data: ReceiptData): Promise<void> {
    try {

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ["000018f0-0000-1000-8000-00805f9b34fb"] }],
        optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"],
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error("Failed to connect to GATT server");

      const service = await server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
      const characteristic = await service.getCharacteristic(
        "00002af1-0000-1000-8000-00805f9b34fb"
      );


      const commands = this.buildReceiptCommands(data);
      const encoder = new TextEncoder();
      const bytes = encoder.encode(commands);


      const chunkSize = 20;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
        await characteristic.writeValue(chunk);
        await this.delay(50); // Small delay between chunks
      }

      device.gatt?.disconnect();
    } catch (error) {
      console.error("Bluetooth print error:", error);
      throw new Error("Gagal print via Bluetooth: " + (error as Error).message);
    }
  }

  /**
   * Print receipt using local printer (server-side)
   */
  static async printViaLocal(data: ReceiptData, printerName: string): Promise<void> {
    try {


      const htmlContent = this.buildReceiptHTML(data);

      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("Failed to open print window");

      printWindow.document.write(htmlContent);
      printWindow.document.close();


      await this.delay(500);

      printWindow.print();
      printWindow.close();
    } catch (error) {
      console.error("Local print error:", error);
      throw new Error("Gagal print via local printer: " + (error as Error).message);
    }
  }

  /**
   * Build HTML for print preview/local printing (Offline Template - DILLA CELL)
   */
  private static buildReceiptHTML(data: ReceiptData): string {
    const itemsHTML = data.items
      .map(
        (item, index) => `
      <div style="margin: 8px 0;">
        <div>${index + 1}. ${item.name}</div>
        <div style="padding-left: 20px; display: flex; justify-content: space-between;">
          <span>${item.quantity} ${this.formatUnit(item)} x ${this.formatCurrency(item.price)}</span>
          <span>${this.formatCurrency(item.subtotal)}</span>
        </div>
      </div>
    `
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt - ${data.transactionNumber}</title>
        <style>
          @media print {
            @page { margin: 0; size: 80mm auto; }
            body { margin: 0; }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            max-width: 80mm;
            margin: 0 auto;
            padding: 10px;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .large { font-size: 16px; }
          .line { border-bottom: 2px solid #000; margin: 8px 0; }
          .two-column { display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="large bold">DILLA CELL</div>
          <div>Ngestikarya, waway karya,</div>
          <div>lampung timur</div>
          <div>Telp: 088287013223</div>
        </div>
        <div class="line"></div>
        
        <div class="two-column">
          <span>${data.date}<br/>${data.time}</span>
          <span>Kasir<br/>${data.cashier}</span>
        </div>
        <div>${data.customerName}</div>
        <div>No.${data.transactionNumber}</div>
        <div class="line"></div>
        
        ${itemsHTML}
        
        <div class="line"></div>
        <div>Total QTY : ${data.totalQty}</div>
        <br/>
        
        <div class="two-column"><span>Sub Total</span><span>${this.formatCurrency(data.subtotal)}</span></div>
        <div class="two-column bold"><span>Total</span><span>${this.formatCurrency(data.total)}</span></div>
        <div class="two-column"><span>Bayar (${data.paymentMethod})</span><span>${this.formatCurrency(data.amountPaid)}</span></div>
        <div class="two-column"><span>Kembali</span><span>${this.formatCurrency(data.change)}</span></div>
        
        <br/>
        <div class="line"></div>
        <div class="center">
          <div>Terima kasih sudah belanja</div>
          <div>di Dilla Store</div>
          <div>Semoga puas dengan layanan kami!</div>
          <div>Hubungi kami: 088287013223</div>
        </div>
        <br/><br/>
      </body>
      </html>
    `;
  }


  private static formatCurrency(amount: number): string {
    return "Rp " + amount.toLocaleString("id-ID");
  }

  private static formatCurrencyShort(amount: number): string {

    if (amount >= 1000000) {
      return "Rp " + (amount / 1000).toFixed(0) + "K";
    }
    return "Rp " + amount.toLocaleString("id-ID");
  }

  private static formatUnit(item: { quantity: number }): string {

    if (item.quantity % 1 !== 0) {
      return "Kg";
    }
    return "Dus";
  }

  private static line(length: number, char: string): string {
    return char.repeat(length);
  }

  private static pad(str: string, length: number): string {
    return " ".repeat(Math.max(0, length));
  }

  private static lineTwoColumn(left: string, right: string, width: number): string {
    const spaces = width - left.length - right.length;
    return left + this.pad("", Math.max(0, spaces)) + right;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
