import { UserSubscription, InvoiceRecord } from "@/types";
import { prisma, isPostgresDatabase } from "../db/prisma";

const inMemorySubscriptions = new Map<string, UserSubscription>();
const inMemoryInvoices = new Map<string, InvoiceRecord>();

export class BillingStore {
  static getAllSubscriptions(): UserSubscription[] {
    return Array.from(inMemorySubscriptions.values());
  }

  static getAllInvoices(): InvoiceRecord[] {
    return Array.from(inMemoryInvoices.values());
  }

  static getSubscription(userId: string): UserSubscription | null {
    if (isPostgresDatabase()) {
      prisma.subscription.findUnique({ where: { userId }, include: { plan: true } })
        .then((dbSub) => {
          if (dbSub) {
            const mapped: UserSubscription = {
              id: dbSub.id,
              userId: dbSub.userId,
              plan: {
                id: dbSub.plan.id,
                name: dbSub.plan.name,
                slug: dbSub.plan.slug as any,
                priceMonthly: Number(dbSub.plan.priceMonthly),
                priceYearly: Number(dbSub.plan.priceYearly),
                maxAccounts: dbSub.plan.maxAccounts,
                maxTradesPerMonth: dbSub.plan.maxTradesPerMonth,
                hasCsvImport: dbSub.plan.hasCsvImport,
                hasAdvancedAnalytics: dbSub.plan.hasAdvancedAnalytics,
                hasPlaybooks: dbSub.plan.hasPlaybooks,
                hasAiMentor: dbSub.plan.hasAiMentor,
                hasReplay: dbSub.plan.hasReplay,
                isActive: dbSub.plan.isActive,
              },
              status: dbSub.status as any,
              billingInterval: dbSub.billingInterval as any,
              stripeCustomerId: dbSub.stripeCustomerId || undefined,
              stripeSubscriptionId: dbSub.stripeSubscriptionId || undefined,
              currentPeriodEnd: dbSub.currentPeriodEnd ? dbSub.currentPeriodEnd.toISOString() : new Date().toISOString(),
              cancelAtPeriodEnd: dbSub.cancelAtPeriodEnd,
              createdAt: dbSub.createdAt.toISOString(),
            };
            inMemorySubscriptions.set(userId, mapped);
          }
        })
        .catch(() => {});
    }
    return inMemorySubscriptions.get(userId) || null;
  }

  static async getSubscriptionAsync(userId: string): Promise<UserSubscription | null> {
    if (isPostgresDatabase()) {
      try {
        const dbSub = await prisma.subscription.findUnique({
          where: { userId },
          include: { plan: true },
        });
        if (dbSub) {
          const mapped: UserSubscription = {
            id: dbSub.id,
            userId: dbSub.userId,
            plan: {
              id: dbSub.plan.id,
              name: dbSub.plan.name,
              slug: dbSub.plan.slug as any,
              priceMonthly: Number(dbSub.plan.priceMonthly),
              priceYearly: Number(dbSub.plan.priceYearly),
              maxAccounts: dbSub.plan.maxAccounts,
              maxTradesPerMonth: dbSub.plan.maxTradesPerMonth,
              hasCsvImport: dbSub.plan.hasCsvImport,
              hasAdvancedAnalytics: dbSub.plan.hasAdvancedAnalytics,
              hasPlaybooks: dbSub.plan.hasPlaybooks,
              hasAiMentor: dbSub.plan.hasAiMentor,
              hasReplay: dbSub.plan.hasReplay,
              isActive: dbSub.plan.isActive,
            },
            status: dbSub.status as any,
            billingInterval: dbSub.billingInterval as any,
            stripeCustomerId: dbSub.stripeCustomerId || undefined,
            stripeSubscriptionId: dbSub.stripeSubscriptionId || undefined,
            currentPeriodEnd: dbSub.currentPeriodEnd ? dbSub.currentPeriodEnd.toISOString() : new Date().toISOString(),
            cancelAtPeriodEnd: dbSub.cancelAtPeriodEnd,
            createdAt: dbSub.createdAt.toISOString(),
          };
          inMemorySubscriptions.set(userId, mapped);
          return mapped;
        }
      } catch (e) {
        console.warn("[BillingStore.getSubscriptionAsync] PostgreSQL fallback to memory:", e);
      }
    }
    return inMemorySubscriptions.get(userId) || null;
  }

  static upsertSubscription(subscription: UserSubscription): UserSubscription {
    inMemorySubscriptions.set(subscription.userId, { ...subscription });

    if (isPostgresDatabase()) {
      prisma.subscription.upsert({
        where: { userId: subscription.userId },
        create: {
          id: subscription.id,
          userId: subscription.userId,
          planId: subscription.plan.id,
          stripeCustomerId: subscription.stripeCustomerId || null,
          stripeSubscriptionId: subscription.stripeSubscriptionId || null,
          status: subscription.status as any,
          billingInterval: subscription.billingInterval,
          currentPeriodEnd: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          createdAt: new Date(subscription.createdAt),
        },
        update: {
          planId: subscription.plan.id,
          stripeCustomerId: subscription.stripeCustomerId || null,
          stripeSubscriptionId: subscription.stripeSubscriptionId || null,
          status: subscription.status as any,
          billingInterval: subscription.billingInterval,
          currentPeriodEnd: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        },
      }).catch((e) => {
        console.warn("[BillingStore.upsertSubscription] PostgreSQL write error:", e);
      });
    }

    return subscription;
  }

  static getInvoicesByUserId(userId: string): InvoiceRecord[] {
    if (isPostgresDatabase()) {
      prisma.invoice.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
        .then((invoices) => {
          for (const inv of invoices) {
            inMemoryInvoices.set(inv.id, {
              id: inv.id,
              userId: inv.userId,
              amount: Number(inv.amount),
              currency: inv.currency,
              status: inv.status as any,
              planName: inv.planName,
              date: inv.createdAt.toISOString(),
              pdfUrl: inv.pdfUrl || undefined,
            });
          }
        })
        .catch(() => {});
    }
    return Array.from(inMemoryInvoices.values())
      .filter((i) => i.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static createInvoice(invoice: InvoiceRecord): InvoiceRecord {
    inMemoryInvoices.set(invoice.id, { ...invoice });

    if (isPostgresDatabase()) {
      prisma.invoice.create({
        data: {
          id: invoice.id,
          userId: invoice.userId,
          amount: invoice.amount,
          currency: invoice.currency,
          status: invoice.status,
          planName: invoice.planName,
          pdfUrl: invoice.pdfUrl || null,
          createdAt: new Date(invoice.date),
        },
      }).catch((e) => {
        console.warn("[BillingStore.createInvoice] PostgreSQL write error:", e);
      });
    }

    return invoice;
  }

  static clear(): void {
    inMemorySubscriptions.clear();
    inMemoryInvoices.clear();
  }
}
