import { SupportTicket } from "@/types";
import { prisma, isPostgresDatabase } from "../db/prisma";

const inMemoryTickets = new Map<string, SupportTicket>();

function mapDbTicketToSupportTicket(dbT: any): SupportTicket {
  let parsedMessages = [];
  try {
    parsedMessages = JSON.parse(dbT.message);
    if (!Array.isArray(parsedMessages)) {
      parsedMessages = [
        {
          id: `msg_${dbT.id}`,
          senderId: dbT.userId,
          senderRole: "USER" as const,
          senderName: "User",
          message: dbT.message,
          createdAt: dbT.createdAt.toISOString(),
        },
      ];
    }
  } catch {
    parsedMessages = [
      {
        id: `msg_${dbT.id}`,
        senderId: dbT.userId,
        senderRole: "USER" as const,
        senderName: "User",
        message: dbT.message,
        createdAt: dbT.createdAt.toISOString(),
      },
    ];
  }

  return {
    id: dbT.id,
    userId: dbT.userId,
    userEmail: dbT.user?.email || "",
    userName: dbT.user?.name || "",
    category: dbT.category as any,
    priority: dbT.priority as any,
    status: dbT.status as any,
    subject: dbT.subject,
    messages: parsedMessages,
    assignedAdminId: undefined,
    createdAt: dbT.createdAt instanceof Date ? dbT.createdAt.toISOString() : String(dbT.createdAt),
    updatedAt: dbT.updatedAt instanceof Date ? dbT.updatedAt.toISOString() : String(dbT.updatedAt),
  };
}

export class TicketStore {
  static getTickets(): SupportTicket[] {
    if (isPostgresDatabase()) {
      prisma.supportTicket.findMany({ orderBy: { updatedAt: "desc" }, include: { user: true } })
        .then((tickets) => {
          for (const t of tickets) inMemoryTickets.set(t.id, mapDbTicketToSupportTicket(t));
        })
        .catch(() => {});
    }
    return Array.from(inMemoryTickets.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  static async getTicketsAsync(): Promise<SupportTicket[]> {
    if (isPostgresDatabase()) {
      try {
        const tickets = await prisma.supportTicket.findMany({
          orderBy: { updatedAt: "desc" },
          include: { user: true },
        });
        const mapped = tickets.map(mapDbTicketToSupportTicket);
        for (const t of mapped) inMemoryTickets.set(t.id, t);
        return mapped;
      } catch (e) {
        console.warn("[TicketStore.getTicketsAsync] PostgreSQL fallback to memory:", e);
      }
    }
    return this.getTickets();
  }

  static getTicketsByUserId(userId: string): SupportTicket[] {
    if (isPostgresDatabase()) {
      prisma.supportTicket.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        include: { user: true },
      })
        .then((tickets) => {
          for (const t of tickets) inMemoryTickets.set(t.id, mapDbTicketToSupportTicket(t));
        })
        .catch(() => {});
    }
    return Array.from(inMemoryTickets.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  static getTicketById(ticketId: string): SupportTicket | null {
    if (isPostgresDatabase()) {
      prisma.supportTicket.findUnique({ where: { id: ticketId }, include: { user: true } })
        .then((t) => {
          if (t) inMemoryTickets.set(t.id, mapDbTicketToSupportTicket(t));
        })
        .catch(() => {});
    }
    return inMemoryTickets.get(ticketId) || null;
  }

  static upsertTicket(ticket: SupportTicket): SupportTicket {
    inMemoryTickets.set(ticket.id, { ...ticket });

    if (isPostgresDatabase()) {
      const serializedMessage = JSON.stringify(ticket.messages || []);
      prisma.supportTicket.upsert({
        where: { id: ticket.id },
        create: {
          id: ticket.id,
          userId: ticket.userId,
          category: ticket.category,
          subject: ticket.subject,
          message: serializedMessage,
          status: ticket.status as any,
          priority: ticket.priority,
          createdAt: new Date(ticket.createdAt),
          updatedAt: new Date(ticket.updatedAt),
        },
        update: {
          category: ticket.category,
          subject: ticket.subject,
          message: serializedMessage,
          status: ticket.status as any,
          priority: ticket.priority,
          updatedAt: new Date(ticket.updatedAt),
        },
      }).catch((e) => {
        console.warn("[TicketStore.upsertTicket] PostgreSQL write error:", e);
      });
    }

    return ticket;
  }

  static deleteTicket(ticketId: string): boolean {
    const existed = inMemoryTickets.delete(ticketId);
    if (!existed) return false;

    if (isPostgresDatabase()) {
      prisma.supportTicket.delete({ where: { id: ticketId } }).catch((e) => {
        console.warn("[TicketStore.deleteTicket] PostgreSQL delete error:", e);
      });
    }

    return true;
  }

  static clear(): void {
    inMemoryTickets.clear();
  }
}
