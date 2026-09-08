import type { DBSchema } from "idb";
import type { Budget, RecurringExpense, Transaction, UserSettings } from "../types";

export const DB_NAME = "finance-intelligence-db";
export const DB_VERSION = 2;

/** Local-only storage shape: every record is tagged with the local auth user it belongs to. */
export type LocalRecord<T> = T & { userId: string };

export interface FinanceDBSchema extends DBSchema {
  transactions: {
    key: string;
    value: LocalRecord<Transaction>;
    indexes: {
      "by-user": string;
      "by-user-date": [string, string];
      "by-user-category": [string, string];
      "by-user-type": [string, string];
    };
  };
  budgets: {
    key: string;
    value: LocalRecord<Budget>;
    indexes: { "by-user": string; "by-user-category": [string, string] };
  };
  recurringExpenses: {
    key: string;
    value: LocalRecord<RecurringExpense>;
    indexes: { "by-user": string };
  };
  settings: {
    key: string;
    value: UserSettings;
  };
}

export const STORE_NAMES = {
  transactions: "transactions",
  budgets: "budgets",
  recurringExpenses: "recurringExpenses",
  settings: "settings",
} as const;
