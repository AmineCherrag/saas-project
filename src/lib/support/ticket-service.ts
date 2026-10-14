import crypto from "crypto";
import {
  SupportTicket,
  TicketMessage,
  TicketPriority,
  TicketStatus,
  TicketCategory,
  UserRole,
} from "@/types";
import { TicketStore } from "./ticket-store";

export class TicketService {
  /**
   * Submit a new customer support ticket
   */
  static createTicket(
    userId: string,
    userEmail: string,
    userName: string,
    category: TicketCategory,
    priority: TicketPriority,
    subject: string,
    initialMessage: string
  ): SupportTicket {
    const now = new Date().toISOString();
    const ticketId = `tkt_${crypto.randomUUID().slice(0, 8)}`;
    const messageId = `msg_${crypto.randomUUID().slice(0, 8)}`;

    const initialMsg: TicketMessage = {
      id: messageId,
      senderId: userId,
      senderRole: "USER",
      senderName: userName || userEmail.split("@")[0],
      message: initialMessage,
      createdAt: now,
    };

    const ticket: SupportTicket = {
      id: ticketId,
      userId,
      userEmail,
      userName: userName || userEmail.split("@")[0],
      category,
      priority,
      status: "OPEN",
      subject,
      messages: [initialMsg],
      createdAt: now,
      updatedAt: now,
    };

    return TicketStore.upsertTicket(ticket);
  }

  /**
   * Retrieve tickets with optional filtering
   */
  static getTickets(filters?: {
    userId?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
  }): SupportTicket[] {
    let tickets = TicketStore.getTickets();

    if (filters?.userId) {
      tickets = tickets.filter((t) => t.userId === filters.userId);
    }
    if (filters?.status) {
      tickets = tickets.filter((t) => t.status === filters.status);
    }
    if (filters?.priority) {
      tickets = tickets.filter((t) => t.priority === filters.priority);
    }
    if (filters?.category) {
      tickets = tickets.filter((t) => t.category === filters.category);
    }

    return tickets;
  }

  /**
   * Retrieve a ticket with permission check
   */
  static getTicketById(
    ticketId: string,
    requestingUserId?: string,
    isAdmin = false
  ): SupportTicket {
    const ticket = TicketStore.getTicketById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket '${ticketId}' not found.`);
    }

    if (!isAdmin && requestingUserId && ticket.userId !== requestingUserId) {
      throw new Error("Access denied: You cannot view tickets belonging to other accounts.");
    }

    return ticket;
  }

  /**
   * Add a response message to a ticket
   */
  static addMessage(
    ticketId: string,
    senderId: string,
    senderRole: UserRole,
    senderName: string,
    message: string
  ): SupportTicket {
    const ticket = TicketStore.getTicketById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket '${ticketId}' not found.`);
    }

    const now = new Date().toISOString();
    const newMsg: TicketMessage = {
      id: `msg_${crypto.randomUUID().slice(0, 8)}`,
      senderId,
      senderRole,
      senderName,
      message,
      createdAt: now,
    };

    ticket.messages.push(newMsg);
    ticket.updatedAt = now;

    // Automatically change status from OPEN to IN_PROGRESS if admin replied
    if (senderRole === "ADMIN" && ticket.status === "OPEN") {
      ticket.status = "IN_PROGRESS";
    }

    return TicketStore.upsertTicket(ticket);
  }

  /**
   * Update status or assigned admin
   */
  static updateStatus(
    ticketId: string,
    status: TicketStatus,
    assignedAdminId?: string
  ): SupportTicket {
    const ticket = TicketStore.getTicketById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket '${ticketId}' not found.`);
    }

    ticket.status = status;
    if (assignedAdminId !== undefined) {
      ticket.assignedAdminId = assignedAdminId;
    }
    ticket.updatedAt = new Date().toISOString();

    return TicketStore.upsertTicket(ticket);
  }
}
