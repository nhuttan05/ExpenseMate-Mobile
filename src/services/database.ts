import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { Transaction, Budget } from '../types';
import { initialTransactions, initialBudgets } from '../data/mockData';

let db: SQLite.SQLiteDatabase | null = null;
let initializationPromise: Promise<void> | null = null;
let memoryTransactions: Transaction[] = [...initialTransactions];
let memoryBudgets: Budget[] = [...initialBudgets];

type TransactionRow = {
  id: string;
  title: string;
  amount: number;
  type: Transaction['type'];
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  categoryBg: string;
  date: string;
  formattedTime?: string | null;
  paymentMethod: string;
  note?: string | null;
};

type BudgetRow = {
  id: string;
  categoryId: string;
  categoryName: string;
  allocatedAmount: number;
  spentAmount: number;
  month: string;
  color: string;
};

const initializeDatabase = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    console.log('[Database] Web environment: using in-memory mock storage');
    return;
  }

  try {
    db = await SQLite.openDatabaseAsync('expensemate.db');

    // Create tables
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        categoryId TEXT NOT NULL,
        categoryName TEXT NOT NULL,
        categoryIcon TEXT NOT NULL,
        categoryColor TEXT NOT NULL,
        categoryBg TEXT NOT NULL,
        date TEXT NOT NULL,
        formattedTime TEXT,
        paymentMethod TEXT NOT NULL,
        note TEXT
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY NOT NULL,
        categoryId TEXT NOT NULL,
        categoryName TEXT NOT NULL,
        allocatedAmount REAL NOT NULL,
        spentAmount REAL NOT NULL,
        month TEXT NOT NULL,
        color TEXT NOT NULL
      );
    `);

    const countResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM transactions');
    if (countResult?.count === 0) {
      console.log('[Database] Seeding initial data into SQLite...');
      for (const tx of initialTransactions) {
        await db.runAsync(
          `INSERT INTO transactions (id, title, amount, type, categoryId, categoryName, categoryIcon, categoryColor, categoryBg, date, formattedTime, paymentMethod, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tx.id,
            tx.title,
            tx.amount,
            tx.type,
            tx.category.id,
            tx.category.name,
            tx.category.icon,
            tx.category.color,
            tx.category.backgroundColor,
            tx.date,
            tx.formattedTime || null,
            tx.paymentMethod,
            tx.note || null,
          ]
        );
      }

    }

    const budgetCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM budgets');
    if (budgetCount?.count === 0) {
      for (const b of initialBudgets) {
        await db.runAsync(
          `INSERT INTO budgets (id, categoryId, categoryName, allocatedAmount, spentAmount, month, color)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [b.id, b.categoryId, b.categoryName, b.allocatedAmount, b.spentAmount, b.month, b.color]
        );
      }
    }
  } catch (error) {
    console.error('[Database] Error initializing SQLite database:', error);
  }
};

export const initDatabase = async (): Promise<void> => {
  if (!initializationPromise) {
    initializationPromise = initializeDatabase();
  }
  await initializationPromise;
};

const ensureDatabase = async (): Promise<void> => {
  if (Platform.OS !== 'web' && !db) {
    await initDatabase();
  }
};

export const fetchAllTransactions = async (): Promise<Transaction[]> => {
  await ensureDatabase();
  if (Platform.OS === 'web' || !db) {
    return memoryTransactions;
  }

  try {
    const rows = await db.getAllAsync<TransactionRow>('SELECT * FROM transactions ORDER BY date DESC, id DESC');
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      amount: r.amount,
      type: r.type,
      category: {
        id: r.categoryId,
        name: r.categoryName,
        icon: r.categoryIcon,
        color: r.categoryColor,
        backgroundColor: r.categoryBg,
        type: r.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
      },
      date: r.date,
      formattedTime: r.formattedTime || r.date,
      paymentMethod: r.paymentMethod,
      note: r.note || undefined,
    }));
  } catch (error) {
    console.error('[Database] Error fetching transactions:', error);
    return memoryTransactions;
  }
};

export const insertTransaction = async (tx: Transaction): Promise<void> => {
  memoryTransactions = [tx, ...memoryTransactions];

  await ensureDatabase();
  if (Platform.OS === 'web' || !db) {
    if (tx.type === 'EXPENSE') {
      memoryBudgets = memoryBudgets.map((budget) => budget.categoryId === tx.category.id
        ? { ...budget, spentAmount: budget.spentAmount + tx.amount }
        : budget);
    }
    return;
  }

  try {
    // Reconcile the old budget allocation before applying the edited transaction.
    const previous = await db.getFirstAsync<{ amount: number; type: string; categoryId: string }>(
      'SELECT amount, type, categoryId FROM transactions WHERE id = ?',
      [tx.id]
    );
    if (previous?.type === 'EXPENSE') {
      await db.runAsync('UPDATE budgets SET spentAmount = spentAmount - ? WHERE categoryId = ?', [previous.amount, previous.categoryId]);
    }

    await db.runAsync(
      `INSERT INTO transactions (id, title, amount, type, categoryId, categoryName, categoryIcon, categoryColor, categoryBg, date, formattedTime, paymentMethod, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tx.id,
        tx.title,
        tx.amount,
        tx.type,
        tx.category.id,
        tx.category.name,
        tx.category.icon,
        tx.category.color,
        tx.category.backgroundColor,
        tx.date,
        tx.formattedTime || null,
        tx.paymentMethod,
        tx.note || null,
      ]
    );

    // Update budget if expense
    if (tx.type === 'EXPENSE') {
      await db.runAsync(
        `UPDATE budgets SET spentAmount = spentAmount + ? WHERE categoryId = ?`,
        [tx.amount, tx.category.id]
      );
    }
  } catch (error) {
    console.error('[Database] Error inserting transaction:', error);
  }
};

export const fetchAllBudgets = async (): Promise<Budget[]> => {
  await ensureDatabase();
  if (Platform.OS === 'web' || !db) {
    return memoryBudgets;
  }

  try {
    const rows = await db.getAllAsync<BudgetRow>('SELECT * FROM budgets');
    return rows.map((r) => ({
      id: r.id,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      allocatedAmount: r.allocatedAmount,
      spentAmount: r.spentAmount,
      month: r.month,
      color: r.color,
    }));
  } catch (error) {
    console.error('[Database] Error fetching budgets:', error);
    return memoryBudgets;
  }
};

export const updateTransaction = async (tx: Transaction): Promise<void> => {
  memoryTransactions = memoryTransactions.map((item) => (item.id === tx.id ? tx : item));

  await ensureDatabase();
  if (Platform.OS === 'web' || !db) return;

  try {
    await db.runAsync(
      `UPDATE transactions SET title = ?, amount = ?, type = ?, categoryId = ?, categoryName = ?,
       categoryIcon = ?, categoryColor = ?, categoryBg = ?, date = ?, formattedTime = ?,
       paymentMethod = ?, note = ? WHERE id = ?`,
      [
        tx.title,
        tx.amount,
        tx.type,
        tx.category.id,
        tx.category.name,
        tx.category.icon,
        tx.category.color,
        tx.category.backgroundColor,
        tx.date,
        tx.formattedTime || null,
        tx.paymentMethod,
        tx.note || null,
        tx.id,
      ]
    );

    if (tx.type === 'EXPENSE') {
      await db.runAsync('UPDATE budgets SET spentAmount = spentAmount + ? WHERE categoryId = ?', [tx.amount, tx.category.id]);
    }
  } catch (error) {
    console.error('[Database] Error updating transaction:', error);
  }
};
