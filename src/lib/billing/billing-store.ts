import fs from "fs";
import path from "path";
import { UserSubscription, InvoiceRecord } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, "subscriptions.json");
const INVOICES_FILE = path.join(DATA_DIR, "invoices.json");

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
  if (!fs.existsSync(INVOICES_FILE)) {
    fs.writeFileSync(INVOICES_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function readSubscriptions(): UserSubscription[] {
  ensureFiles();
  try {
    const raw = fs.readFileSync(SUBSCRIPTIONS_FILE, "utf-8");
    return JSON.parse(raw) as UserSubscription[];
  } catch {
    return [];
  }
}

function writeSubscriptions(subs: UserSubscription[]) {
  ensureFiles();
  fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2), "utf-8");
}

function readInvoices(): InvoiceRecord[] {
  ensureFiles();
  try {
    const raw = fs.readFileSync(INVOICES_FILE, "utf-8");
    return JSON.parse(raw) as InvoiceRecord[];
  } catch {
    return [];
  }
}

function writeInvoices(invoices: InvoiceRecord[]) {
  ensureFiles();
  fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2), "utf-8");
}

export class BillingStore {
  static getAllSubscriptions(): UserSubscription[] {
    return readSubscriptions();
  }

  static getAllInvoices(): InvoiceRecord[] {
    return readInvoices();
  }

  static getSubscription(userId: string): UserSubscription | null {
    const subs = readSubscriptions();
    return subs.find((s) => s.userId === userId) || null;
  }

  static upsertSubscription(subscription: UserSubscription): UserSubscription {
    const subs = readSubscriptions();
    const index = subs.findIndex((s) => s.userId === subscription.userId);

    if (index !== -1) {
      subs[index] = subscription;
    } else {
      subs.push(subscription);
    }

    writeSubscriptions(subs);
    return subscription;
  }

  static getInvoicesByUserId(userId: string): InvoiceRecord[] {
    const invoices = readInvoices();
    return invoices
      .filter((i) => i.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static createInvoice(invoice: InvoiceRecord): InvoiceRecord {
    const invoices = readInvoices();
    invoices.push(invoice);
    writeInvoices(invoices);
    return invoice;
  }

  static clear(): void {
    writeSubscriptions([]);
    writeInvoices([]);
  }
}
