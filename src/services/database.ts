import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import {
  Transaction,
  Budget,
  Wallet,
  JarEnvelope,
  RecurringTransaction,
  DebtLoanItem,
  WhatIfScenario,
  FinancialChallenge,
} from '../types';
import {
  initialTransactions,
  initialBudgets,
  initialWallets,
  initialJars,
  initialRecurring,
  initialDebts,
  initialScenarios,
  initialChallenges,
} from '../data/mockData';

let db: SQLite.SQLiteDatabase | null = null;
let initializationPromise: Promise<void> | null = null;

// In-memory fallbacks (for Web or SQLite initialization fallback)
let memoryTransactions: Transaction[] = [...initialTransactions];
let memoryBudgets: Budget[] = [...initialBudgets];
let memoryWallets: Wallet[] = [...initialWallets];
let memoryJars: JarEnvelope[] = [...initialJars];
let memoryRecurring: RecurringTransaction[] = [...initialRecurring];
let memoryDebts: DebtLoanItem[] = [...initialDebts];
let memoryScenarios: WhatIfScenario[] = [...initialScenarios];
let memoryChallenges: FinancialChallenge[] = [...initialChallenges];

const initializeDatabase = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    console.log('[Database] Web platform: using reactive in-memory storage');
    return;
  }

  try {
    db = await SQLite.openDatabaseAsync('expensemate.db');

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
        walletId TEXT,
        targetWalletId TEXT,
        jarCode TEXT,
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

      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance REAL NOT NULL,
        currency TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        backgroundColor TEXT NOT NULL,
        accountNumber TEXT,
        creditLimit REAL,
        isExcludedFromTotal INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS jars (
        id TEXT PRIMARY KEY NOT NULL,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        vietnameseName TEXT NOT NULL,
        percentage REAL NOT NULL,
        allocatedAmount REAL NOT NULL,
        spentAmount REAL NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        description TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recurring_transactions (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        categoryId TEXT NOT NULL,
        walletId TEXT NOT NULL,
        frequency TEXT NOT NULL,
        dayOfMonth INTEGER NOT NULL,
        status TEXT NOT NULL,
        nextDueDate TEXT NOT NULL,
        note TEXT
      );

      CREATE TABLE IF NOT EXISTS debts_loans (
        id TEXT PRIMARY KEY NOT NULL,
        personName TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        dueDate TEXT NOT NULL,
        status TEXT NOT NULL,
        note TEXT,
        createdAt TEXT NOT NULL,
        phoneNumber TEXT
      );

      CREATE TABLE IF NOT EXISTS whatif_scenarios (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        targetAmount REAL NOT NULL,
        monthlyPayment REAL,
        durationMonths INTEGER,
        category TEXT NOT NULL,
        impactAssessment TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        feasibilityScore REAL NOT NULL,
        safeToBuy INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        targetDays INTEGER NOT NULL,
        currentDays INTEGER NOT NULL,
        potentialSavings REAL NOT NULL,
        icon TEXT NOT NULL,
        status TEXT NOT NULL,
        badgeName TEXT NOT NULL
      );
    `);

    // Seed Transactions
    const txCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM transactions');
    if (txCount?.count === 0) {
      for (const tx of initialTransactions) {
        await db.runAsync(
          `INSERT INTO transactions (id, title, amount, type, categoryId, categoryName, categoryIcon, categoryColor, categoryBg, date, formattedTime, paymentMethod, walletId, jarCode, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            tx.walletId || null,
            tx.jarCode || null,
            tx.note || null,
          ]
        );
      }
    }

    // Seed Budgets
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

    // Seed Wallets
    const walletCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM wallets');
    if (walletCount?.count === 0) {
      for (const w of initialWallets) {
        await db.runAsync(
          `INSERT INTO wallets (id, name, type, balance, currency, icon, color, backgroundColor, accountNumber, creditLimit, isExcludedFromTotal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            w.id,
            w.name,
            w.type,
            w.balance,
            w.currency,
            w.icon,
            w.color,
            w.backgroundColor,
            w.accountNumber || null,
            w.creditLimit || null,
            w.isExcludedFromTotal ? 1 : 0,
          ]
        );
      }
    }

    // Seed Jars
    const jarCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM jars');
    if (jarCount?.count === 0) {
      for (const j of initialJars) {
        await db.runAsync(
          `INSERT INTO jars (id, code, name, vietnameseName, percentage, allocatedAmount, spentAmount, color, icon, description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [j.id, j.code, j.name, j.vietnameseName, j.percentage, j.allocatedAmount, j.spentAmount, j.color, j.icon, j.description]
        );
      }
    }

    // Seed Recurring
    const recCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM recurring_transactions');
    if (recCount?.count === 0) {
      for (const r of initialRecurring) {
        await db.runAsync(
          `INSERT INTO recurring_transactions (id, title, amount, type, categoryId, walletId, frequency, dayOfMonth, status, nextDueDate, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [r.id, r.title, r.amount, r.type, r.categoryId, r.walletId, r.frequency, r.dayOfMonth, r.status, r.nextDueDate, r.note || null]
        );
      }
    }

    // Seed Debts
    const debtCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM debts_loans');
    if (debtCount?.count === 0) {
      for (const d of initialDebts) {
        await db.runAsync(
          `INSERT INTO debts_loans (id, personName, amount, type, dueDate, status, note, createdAt, phoneNumber)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [d.id, d.personName, d.amount, d.type, d.dueDate, d.status, d.note || null, d.createdAt, d.phoneNumber || null]
        );
      }
    }

    // Seed Scenarios
    const scCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM whatif_scenarios');
    if (scCount?.count === 0) {
      for (const s of initialScenarios) {
        await db.runAsync(
          `INSERT INTO whatif_scenarios (id, title, targetAmount, monthlyPayment, durationMonths, category, impactAssessment, recommendation, feasibilityScore, safeToBuy)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.id, s.title, s.targetAmount, s.monthlyPayment || null, s.durationMonths || null, s.category, s.impactAssessment, s.recommendation, s.feasibilityScore, s.safeToBuy ? 1 : 0]
        );
      }
    }

    // Seed Challenges
    const chCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM challenges');
    if (chCount?.count === 0) {
      for (const c of initialChallenges) {
        await db.runAsync(
          `INSERT INTO challenges (id, title, description, targetDays, currentDays, potentialSavings, icon, status, badgeName)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.title, c.description, c.targetDays, c.currentDays, c.potentialSavings, c.icon, c.status, c.badgeName]
        );
      }
    }
  } catch (error) {
    console.error('[Database] SQLite init error, using in-memory mode:', error);
  }
};

export const initDatabase = async (): Promise<void> => {
  if (!initializationPromise) {
    initializationPromise = initializeDatabase();
  }
  return initializationPromise;
};

// ==================== TRANSACTIONS ====================
export const fetchAllTransactions = async (): Promise<Transaction[]> => {
  await initDatabase();
  if (!db || Platform.OS === 'web') return [...memoryTransactions];
  try {
    const rows = await db.getAllAsync<any>('SELECT * FROM transactions ORDER BY date DESC, id DESC');
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
        type: r.type === 'TRANSFER' ? 'EXPENSE' : r.type,
      },
      date: r.date,
      formattedTime: r.formattedTime,
      paymentMethod: r.paymentMethod,
      walletId: r.walletId || undefined,
      targetWalletId: r.targetWalletId || undefined,
      jarCode: r.jarCode || undefined,
      note: r.note || undefined,
    }));
  } catch (err) {
    return [...memoryTransactions];
  }
};

export const insertTransaction = async (tx: Transaction): Promise<void> => {
  await initDatabase();
  memoryTransactions = [tx, ...memoryTransactions];

  // Auto update wallet balance
  if (tx.walletId) {
    const amountDelta = tx.type === 'INCOME' ? tx.amount : -tx.amount;
    await updateWalletBalance(tx.walletId, amountDelta);
  }
  if (tx.type === 'TRANSFER' && tx.targetWalletId) {
    await updateWalletBalance(tx.targetWalletId, tx.amount);
  }

  if (!db || Platform.OS === 'web') return;
  try {
    await db.runAsync(
      `INSERT INTO transactions (id, title, amount, type, categoryId, categoryName, categoryIcon, categoryColor, categoryBg, date, formattedTime, paymentMethod, walletId, targetWalletId, jarCode, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        tx.walletId || null,
        tx.targetWalletId || null,
        tx.jarCode || null,
        tx.note || null,
      ]
    );
  } catch (err) {
    console.error('Insert transaction failed:', err);
  }
};

export const updateTransaction = async (tx: Transaction): Promise<void> => {
  await initDatabase();
  memoryTransactions = memoryTransactions.map((t) => (t.id === tx.id ? tx : t));
  if (!db || Platform.OS === 'web') return;
  try {
    await db.runAsync(
      `UPDATE transactions SET title = ?, amount = ?, type = ?, categoryId = ?, categoryName = ?, categoryIcon = ?, categoryColor = ?, categoryBg = ?, date = ?, formattedTime = ?, paymentMethod = ?, walletId = ?, targetWalletId = ?, jarCode = ?, note = ? WHERE id = ?`,
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
        tx.walletId || null,
        tx.targetWalletId || null,
        tx.jarCode || null,
        tx.note || null,
        tx.id,
      ]
    );
  } catch (err) {
    console.error('Update transaction failed:', err);
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await initDatabase();
  memoryTransactions = memoryTransactions.filter((t) => t.id !== id);
  if (!db || Platform.OS === 'web') return;
  try {
    await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
  } catch (err) {
    console.error('Delete transaction failed:', err);
  }
};

// ==================== WALLETS ====================
export const fetchAllWallets = async (): Promise<Wallet[]> => {
  await initDatabase();
  if (!db || Platform.OS === 'web') return [...memoryWallets];
  try {
    const rows = await db.getAllAsync<any>('SELECT * FROM wallets ORDER BY balance DESC');
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      balance: r.balance,
      currency: r.currency,
      icon: r.icon,
      color: r.color,
      backgroundColor: r.backgroundColor,
      accountNumber: r.accountNumber || undefined,
      creditLimit: r.creditLimit || undefined,
      isExcludedFromTotal: Boolean(r.isExcludedFromTotal),
    }));
  } catch (err) {
    return [...memoryWallets];
  }
};

export const insertWallet = async (wallet: Wallet): Promise<void> => {
  await initDatabase();
  memoryWallets = [...memoryWallets, wallet];
  if (!db || Platform.OS === 'web') return;
  try {
    await db.runAsync(
      `INSERT INTO wallets (id, name, type, balance, currency, icon, color, backgroundColor, accountNumber, creditLimit, isExcludedFromTotal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        wallet.id,
        wallet.name,
        wallet.type,
        wallet.balance,
        wallet.currency,
        wallet.icon,
        wallet.color,
        wallet.backgroundColor,
        wallet.accountNumber || null,
        wallet.creditLimit || null,
        wallet.isExcludedFromTotal ? 1 : 0,
      ]
    );
  } catch (err) {
    console.error('Insert wallet failed:', err);
  }
};

export const updateWalletBalance = async (walletId: string, deltaAmount: number): Promise<void> => {
  await initDatabase();
  memoryWallets = memoryWallets.map((w) => (w.id === walletId ? { ...w, balance: w.balance + deltaAmount } : w));
  if (!db || Platform.OS === 'web') return;
  try {
    await db.runAsync('UPDATE wallets SET balance = balance + ? WHERE id = ?', [deltaAmount, walletId]);
  } catch (err) {
    console.error('Update wallet balance failed:', err);
  }
};

export const transferBetweenWallets = async (
  fromWalletId: string,
  toWalletId: string,
  amount: number,
  fee: number = 0,
  note?: string
): Promise<Transaction> => {
  await initDatabase();
  await updateWalletBalance(fromWalletId, -(amount + fee));
  await updateWalletBalance(toWalletId, amount);

  const fromWallet = memoryWallets.find((w) => w.id === fromWalletId);
  const toWallet = memoryWallets.find((w) => w.id === toWalletId);

  const transferTx: Transaction = {
    id: `transfer_${Date.now()}`,
    title: `Chuyển ví: ${fromWallet?.name || 'Ví'} → ${toWallet?.name || 'Ví'}`,
    amount,
    type: 'TRANSFER',
    category: {
      id: 'cat_transfer',
      name: 'Chuyển tiền nội bộ',
      icon: 'sync-alt',
      color: '#0284C7',
      backgroundColor: '#E0F2FE',
      type: 'EXPENSE',
    },
    date: new Date().toISOString().split('T')[0],
    formattedTime: 'Vừa xong',
    paymentMethod: 'Chuyển khoản nội bộ',
    walletId: fromWalletId,
    targetWalletId: toWalletId,
    note: note || `Phí chuyển: ${fee.toLocaleString('vi-VN')} đ`,
  };

  await insertTransaction(transferTx);
  return transferTx;
};

// ==================== JARS (6 CHIẾC LỌ) ====================
export const fetchAllJars = async (): Promise<JarEnvelope[]> => {
  await initDatabase();
  if (!db || Platform.OS === 'web') return [...memoryJars];
  try {
    const rows = await db.getAllAsync<any>('SELECT * FROM jars ORDER BY percentage DESC');
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      vietnameseName: r.vietnameseName,
      percentage: r.percentage,
      allocatedAmount: r.allocatedAmount,
      spentAmount: r.spentAmount,
      color: r.color,
      icon: r.icon,
      description: r.description,
    }));
  } catch (err) {
    return [...memoryJars];
  }
};

export const updateJarAllocation = async (code: string, newPercentage: number, newAllocated: number): Promise<void> => {
  await initDatabase();
  memoryJars = memoryJars.map((j) => (j.code === code ? { ...j, percentage: newPercentage, allocatedAmount: newAllocated } : j));
  if (!db || Platform.OS === 'web') return;
  try {
    await db.runAsync('UPDATE jars SET percentage = ?, allocatedAmount = ? WHERE code = ?', [newPercentage, newAllocated, code]);
  } catch (err) {
    console.error('Update jar failed:', err);
  }
};

// ==================== RECURRING TRANSACTIONS ====================
export const fetchAllRecurring = async (): Promise<RecurringTransaction[]> => {
  await initDatabase();
  if (!db || Platform.OS === 'web') return [...memoryRecurring];
  try {
    const rows = await db.getAllAsync<any>('SELECT * FROM recurring_transactions ORDER BY dayOfMonth ASC');
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      amount: r.amount,
      type: r.type,
      categoryId: r.categoryId,
      walletId: r.walletId,
      frequency: r.frequency,
      dayOfMonth: r.dayOfMonth,
      status: r.status,
      nextDueDate: r.nextDueDate,
      note: r.note || undefined,
    }));
  } catch (err) {
    return [...memoryRecurring];
  }
};

export const insertRecurring = async (rec: RecurringTransaction): Promise<void> => {
  await initDatabase();
  memoryRecurring = [...memoryRecurring, rec];
  if (!db || Platform.OS === 'web') return;
  try {
    await db.runAsync(
      `INSERT INTO recurring_transactions (id, title, amount, type, categoryId, walletId, frequency, dayOfMonth, status, nextDueDate, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [rec.id, rec.title, rec.amount, rec.type, rec.categoryId, rec.walletId, rec.frequency, rec.dayOfMonth, rec.status, rec.nextDueDate, rec.note || null]
    );
  } catch (err) {
    console.error('Insert recurring failed:', err);
  }
};

export const toggleRecurringStatus = async (id: string): Promise<void> => {
  await initDatabase();
  memoryRecurring = memoryRecurring.map((r) =>
    r.id === id ? { ...r, status: r.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : r
  );
  if (!db || Platform.OS === 'web') return;
  try {
    await db.runAsync(
      `UPDATE recurring_transactions SET status = CASE WHEN status = 'ACTIVE' THEN 'PAUSED' ELSE 'ACTIVE' END WHERE id = ?`,
      [id]
    );
  } catch (err) {
    console.error('Toggle recurring failed:', err);
  }
};

// ==================== DEBTS & LOANS (SỔ NỢ) ====================
export const fetchAllDebts = async (): Promise<DebtLoanItem[]> => {
  await initDatabase();
  if (!db || Platform.OS === 'web') return [...memoryDebts];
  try {
    const rows = await db.getAllAsync<any>('SELECT * FROM debts_loans ORDER BY status DESC, dueDate ASC');
    return rows.map((r) => ({
      id: r.id,
      personName: r.personName,
      amount: r.amount,
      type: r.type,
      dueDate: r.dueDate,
      status: r.status,
      note: r.note || undefined,
      createdAt: r.createdAt,
      phoneNumber: r.phoneNumber || undefined,
    }));
  } catch (err) {
    return [...memoryDebts];
  }
};

export const insertDebt = async (debt: DebtLoanItem): Promise<void> => {
  await initDatabase();
  memoryDebts = [debt, ...memoryDebts];
  if (!db || Platform.OS === 'web') return;
  try {
    await db.runAsync(
      `INSERT INTO debts_loans (id, personName, amount, type, dueDate, status, note, createdAt, phoneNumber)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [debt.id, debt.personName, debt.amount, debt.type, debt.dueDate, debt.status, debt.note || null, debt.createdAt, debt.phoneNumber || null]
    );
  } catch (err) {
    console.error('Insert debt failed:', err);
  }
};

export const settleDebt = async (id: string): Promise<void> => {
  await initDatabase();
  memoryDebts = memoryDebts.map((d) => (d.id === id ? { ...d, status: 'SETTLED' } : d));
  if (!db || Platform.OS === 'web') return;
  try {
    await db.runAsync("UPDATE debts_loans SET status = 'SETTLED' WHERE id = ?", [id]);
  } catch (err) {
    console.error('Settle debt failed:', err);
  }
};

// ==================== WHAT-IF SCENARIOS ====================
export const fetchAllScenarios = async (): Promise<WhatIfScenario[]> => {
  await initDatabase();
  if (!db || Platform.OS === 'web') return [...memoryScenarios];
  try {
    const rows = await db.getAllAsync<any>('SELECT * FROM whatif_scenarios ORDER BY feasibilityScore DESC');
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      targetAmount: r.targetAmount,
      monthlyPayment: r.monthlyPayment || undefined,
      durationMonths: r.durationMonths || undefined,
      category: r.category,
      impactAssessment: r.impactAssessment,
      recommendation: r.recommendation,
      feasibilityScore: r.feasibilityScore,
      safeToBuy: Boolean(r.safeToBuy),
    }));
  } catch (err) {
    return [...memoryScenarios];
  }
};

export const insertScenario = async (sc: WhatIfScenario): Promise<void> => {
  await initDatabase();
  memoryScenarios = [sc, ...memoryScenarios];
  if (!db || Platform.OS === 'web') return;
  try {
    await db.runAsync(
      `INSERT INTO whatif_scenarios (id, title, targetAmount, monthlyPayment, durationMonths, category, impactAssessment, recommendation, feasibilityScore, safeToBuy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sc.id, sc.title, sc.targetAmount, sc.monthlyPayment || null, sc.durationMonths || null, sc.category, sc.impactAssessment, sc.recommendation, sc.feasibilityScore, sc.safeToBuy ? 1 : 0]
    );
  } catch (err) {
    console.error('Insert scenario failed:', err);
  }
};

// ==================== CHALLENGES ====================
export const fetchAllChallenges = async (): Promise<FinancialChallenge[]> => {
  await initDatabase();
  if (!db || Platform.OS === 'web') return [...memoryChallenges];
  try {
    const rows = await db.getAllAsync<any>('SELECT * FROM challenges ORDER BY targetDays ASC');
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      targetDays: r.targetDays,
      currentDays: r.currentDays,
      potentialSavings: r.potentialSavings,
      icon: r.icon,
      status: r.status,
      badgeName: r.badgeName,
    }));
  } catch (err) {
    return [...memoryChallenges];
  }
};

export const updateChallengeProgress = async (id: string): Promise<void> => {
  await initDatabase();
  memoryChallenges = memoryChallenges.map((c) => {
    if (c.id !== id) return c;
    const nextDays = Math.min(c.targetDays, c.currentDays + 1);
    return {
      ...c,
      currentDays: nextDays,
      status: nextDays >= c.targetDays ? 'COMPLETED' : 'IN_PROGRESS',
    };
  });

  if (!db || Platform.OS === 'web') return;
  try {
    await db.runAsync(
      `UPDATE challenges
       SET currentDays = MIN(targetDays, currentDays + 1),
           status = CASE WHEN currentDays + 1 >= targetDays THEN 'COMPLETED' ELSE 'IN_PROGRESS' END
       WHERE id = ?`,
      [id]
    );
  } catch (err) {
    console.error('Update challenge failed:', err);
  }
};

// ==================== BUDGETS ====================
export const fetchAllBudgets = async (): Promise<Budget[]> => {
  await initDatabase();
  if (!db || Platform.OS === 'web') return [...memoryBudgets];
  try {
    const rows = await db.getAllAsync<any>('SELECT * FROM budgets');
    return rows.map((r) => ({
      id: r.id,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      allocatedAmount: r.allocatedAmount,
      spentAmount: r.spentAmount,
      month: r.month,
      color: r.color,
    }));
  } catch (err) {
    return [...memoryBudgets];
  }
};
