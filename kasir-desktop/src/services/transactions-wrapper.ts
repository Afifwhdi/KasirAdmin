import { isElectron, transactionService as electronTransactionService, electronDB } from "./electron-db";
import {
  transactionsApi,
  CreateTransactionData,
  TransactionsPaginationParams,
  TransactionsPaginationResponse,
} from "@/features/transactions/services/api";

export const transactionsWrapper = {
  async getAll(params?: TransactionsPaginationParams): Promise<TransactionsPaginationResponse> {
    if (isElectron()) {
      // Mode Electron: pakai SQLite
      const transactions = await electronTransactionService.getAll();

      const parsed = (transactions as Record<string, unknown>[]).map((tx) => ({
        ...tx,
        items: typeof tx.items === "string" ? JSON.parse(tx.items) : tx.items,
        transaction_number: tx.uuid,
        cash_received: tx.payment_amount,
        // Map untuk TransactionsPage compatibility
        nama_customer: tx.customer_name || tx.name,
        total_harga: tx.total,
        nominal_bayar: tx.payment_amount,
        kembalian: tx.change_amount,
        transaksi_dibuat: tx.created_at,
        pembayaran: tx.payment_method === "cash" && tx.status === "paid" ? "Tunai" : "Bon/Piutang",
        change: tx.change_amount,
      }));

      // Filter
      let filtered = parsed;
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = parsed.filter(
          (tx) => {
            const uuid = String(tx.uuid || '').toLowerCase();
            const transNum = String(tx.transaction_number || '').toLowerCase();
            return uuid.includes(search) || transNum.includes(search);
          }
        );
      }

      // Pagination
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const total = filtered.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = filtered.slice(start, end);

      return {
        status: "success",
        message: "Transactions loaded from local database",
        data: paginated,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } else {
      // Mode Browser: pakai API
      return transactionsApi.getAll(params);
    }
  },

  async create(data: CreateTransactionData) {
    if (isElectron()) {
      // Mode Electron: simpan ke SQLite
      const transaction = {
        uuid: data.transaction_number || crypto.randomUUID(),
        total: data.total,
        payment_method: data.payment_method_id === 1 ? "cash" : "qris",
        payment_amount: data.cash_received,
        change_amount: data.change_amount,
        status: data.status || "paid",
        customer_name: data.name || "",
        items: data.items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name_snapshot,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
      };

      const result = await electronTransactionService.create(transaction);

      return {
        status: "success",
        message: "Transaction created in local database",
        data: {
          id: result.lastInsertRowid,
          ...transaction,
          created_at: new Date().toISOString(),
        },
      };
    } else {
      // Mode Browser: kirim ke API
      return transactionsApi.create(data);
    }
  },

  async getUnsynced() {
    if (isElectron()) {
      return electronTransactionService.getUnsynced();
    }
    return [];
  },

  async syncToServer() {
    if (!isElectron()) {
      throw new Error("Sync only available in Electron mode");
    }

    console.log("🚀 Starting sync to server...");
    const unsynced = await electronTransactionService.getUnsynced();
    const synced = [];
    const failed = [];
    const updated = [];
    const created = [];

    if (unsynced.length === 0) {
      console.log("✅ No unsynced transactions found");
      return { synced, failed, updated, created };
    }

    console.log(`📋 Found ${unsynced.length} unsynced transactions`);

    for (const [index, tx] of unsynced.entries()) {
      try {
        console.log(`📤 Syncing ${index + 1}/${unsynced.length}: ${tx.uuid}`);
        
        const items = typeof tx.items === "string" ? JSON.parse(tx.items) : tx.items;
        let validatedTotal = tx.total;
        let validatedItems = items;
        let validatedUuid = tx.uuid;
        
        if (!validatedUuid) {
          validatedUuid = `TRX-${Date.now()}-${tx.id}`;
          console.log(`   🔧 Generated UUID for transaction ID ${tx.id}: ${validatedUuid}`);
          await electronDB.run('UPDATE transactions SET uuid = ? WHERE id = ?', [validatedUuid, tx.id]);
        }
        
        if (!validatedTotal || validatedTotal === 0) {
          if (validatedItems && validatedItems.length > 0) {
            validatedTotal = validatedItems.reduce((sum: number, item: any) => {
              return sum + (item.subtotal || (item.price * item.quantity) || 0);
            }, 0);
            console.log(`   🔧 Calculated total for transaction ID ${tx.id}: ${validatedTotal}`);
          } else {
            validatedTotal = tx.payment_amount || 1000;
            console.log(`   🔧 Set default total for transaction ID ${tx.id}: ${validatedTotal}`);
          }
        }
        
        if (!validatedItems || validatedItems.length === 0) {
          validatedItems = [{
            product_id: 1,
            product_name: 'Unknown Product',
            quantity: 1,
            price: validatedTotal,
            subtotal: validatedTotal
          }];
          console.log(`   🔧 Generated default items for transaction ID ${tx.id}`);
        }
        
        if (!validatedUuid || !validatedTotal || !validatedItems || validatedItems.length === 0) {
          throw new Error(`Invalid transaction data after fix attempts: UUID=${!!validatedUuid}, Total=${validatedTotal}, Items=${validatedItems?.length || 0}`);
        }

        const payload = {
          transaction_number: validatedUuid,
          name: tx.customer_name || "",
          payment_method_id: tx.payment_method === "cash" ? 1 : 2,
          total: validatedTotal,
          cash_received: tx.payment_amount || 0,
          change_amount: tx.change_amount || 0,
          status: tx.status || "paid",
          items: (validatedItems as Record<string, unknown>[]).map((item) => ({
            product_id: item.product_id || 1,
            product_name_snapshot: item.product_name || item.product_name_snapshot || "Unknown Product",
            quantity: item.quantity || 1,
            price: item.price || 0,
            subtotal: item.subtotal || (item.price * item.quantity) || 0,
            cost_price: item.cost_price || 0,
            total_profit: item.total_profit || 0,
          })),
        };

        console.log(`   📦 Payload for ${tx.uuid}:`, {
          transaction_number: payload.transaction_number,
          status: payload.status,
          total: payload.total,
          cash_received: payload.cash_received,
          items_count: payload.items.length
        });

        const result = await transactionsApi.create(payload);
        
        // CRITICAL: Validate server response before marking as synced
        if (!result || result.status !== 'success') {
          throw new Error(`Server response failed: ${result?.message || 'Unknown error'}`);
        }
        
        const isUpdated = result.data?.updated === true;
        const actionType = isUpdated ? 'updated' : 'created';
        
        console.log(`   ✅ Transaction ${tx.uuid} ${actionType} successfully`);
        
        // CRITICAL: Mark as synced ONLY after confirmed success
        await electronTransactionService.markSynced(tx.id);
        
        synced.push({ ...tx, server_action: actionType });
        if (isUpdated) {
          updated.push(tx);
        } else {
          created.push(tx);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Failed to sync transaction ${tx.uuid}:`, errorMessage);
        
        failed.push({
          ...tx,
          sync_error: errorMessage,
          sync_attempt_time: new Date().toISOString(),
        });
      }
    }

    const summary = {
      total: unsynced.length,
      synced: synced.length,
      created: created.length,
      updated: updated.length,
      failed: failed.length,
    };

    console.log("📊 Sync Summary:", summary);
    
    return { 
      synced, 
      failed, 
      updated, 
      created, 
      summary 
    };
  },

  async updateStatus(id: number, status: "pending" | "paid" | "cancelled" | "refunded") {
    if (isElectron()) {
      await electronTransactionService.updateStatus(id, status);
      return {
        status: "success",
        message: `Status diubah ke ${status}. Akan disync ke server saat online.`,
        data: { id, status },
      };
    }
    return transactionsApi.updateStatus(id, status);
  },

  async payBon(id: number, cashReceived: number, changeAmount: number) {
    if (isElectron()) {
      await electronTransactionService.payBon(id, cashReceived, changeAmount);
      return {
        status: "success",
        message: "Pembayaran BON berhasil. Akan disync ke server saat online.",
        data: { id, cash_received: cashReceived, change_amount: changeAmount, status: "paid" },
      };
    }
    return transactionsApi.payBon(id, cashReceived, changeAmount);
  },

  async getDetail(id: number) {
    if (isElectron()) {
      const tx = await electronTransactionService.getById(id);
      if (!tx) {
        throw new Error("Transaction not found");
      }

      return {
        status: "success",
        message: "Transaction detail loaded from local database",
        data: {
          ...tx,
          items: typeof tx.items === "string" ? JSON.parse(tx.items) : tx.items,
          transaction_number: tx.uuid,
          cash_received: tx.payment_amount,
        },
      };
    } else {
      return transactionsApi.getDetail(id);
    }
  },
};
