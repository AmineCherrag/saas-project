import fs from "fs";
import path from "path";
import { SupportTicket } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const TICKETS_FILE = path.join(DATA_DIR, "tickets.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TICKETS_FILE)) {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function readTickets(): SupportTicket[] {
  ensureFile();
  try {
    const raw = fs.readFileSync(TICKETS_FILE, "utf-8");
    return JSON.parse(raw) as SupportTicket[];
  } catch {
    return [];
  }
}

function writeTickets(tickets: SupportTicket[]) {
  ensureFile();
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), "utf-8");
}

export class TicketStore {
  static getTickets(): SupportTicket[] {
    return readTickets().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  static getTicketsByUserId(userId: string): SupportTicket[] {
    return readTickets()
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  static getTicketById(ticketId: string): SupportTicket | null {
    const tickets = readTickets();
    return tickets.find((t) => t.id === ticketId) || null;
  }

  static upsertTicket(ticket: SupportTicket): SupportTicket {
    const tickets = readTickets();
    const index = tickets.findIndex((t) => t.id === ticket.id);

    if (index !== -1) {
      tickets[index] = ticket;
    } else {
      tickets.push(ticket);
    }

    writeTickets(tickets);
    return ticket;
  }

  static deleteTicket(ticketId: string): boolean {
    const tickets = readTickets();
    const filtered = tickets.filter((t) => t.id !== ticketId);
    if (filtered.length !== tickets.length) {
      writeTickets(filtered);
      return true;
    }
    return false;
  }

  static clear(): void {
    writeTickets([]);
  }
}
