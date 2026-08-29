import Dexie, { Table } from 'dexie';

export interface OfflineBill {
  id?: number; // IndexedDB auto-increment
  idempotencyKey: string;
  outletId: string;
  shiftId: string;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discount: number;
  finalAmount: number;
  items: any[];
  synced: boolean;
  createdAt: string;
}

export class PosDatabase extends Dexie {
  bills!: Table<OfflineBill, number>;
  catalog!: Table<any, string>; // Store menu items offline

  constructor() {
    super('PosDatabase');
    this.version(1).stores({
      bills: '++id, idempotencyKey, synced',
      catalog: 'id, category'
    });
  }
}

export const db = new PosDatabase();

// Background sync stub
export async function syncOfflineBills() {
  const unsynced = await db.bills.where('synced').equals(0).toArray();
  for (const bill of unsynced) {
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': bill.idempotencyKey
        },
        body: JSON.stringify(bill)
      });
      if (res.ok) {
        await db.bills.update(bill.id!, { synced: true });
      }
    } catch (error) {
      console.error('Failed to sync bill', bill.idempotencyKey, error);
    }
  }
}
