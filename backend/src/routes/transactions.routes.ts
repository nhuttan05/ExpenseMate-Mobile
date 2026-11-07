import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../errors';
import { query } from '../db';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

const transactionType = z.enum(['INCOME', 'EXPENSE', 'TRANSFER']);
const transactionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  type: transactionType,
  amount: z.coerce.number().positive().finite(),
  categoryId: z.string().trim().max(80).nullable().optional(),
  note: z.string().trim().max(2000).nullable().optional(),
  date: z.string().trim().min(1).max(40),
  paymentMethod: z.string().trim().max(80).default('CASH'),
  walletId: z.string().trim().max(120).nullable().optional(),
  targetWalletId: z.string().trim().max(120).nullable().optional(),
  attachments: z.array(z.string().max(1000)).max(20).default([]),
  clientId: z.string().trim().max(120).nullable().optional(),
});

const updateSchema = transactionSchema.partial();
const validationError = (result: { success: false; error: z.ZodError }) =>
  new ApiError(400, 'VALIDATION_ERROR', 'Dữ liệu giao dịch không hợp lệ.', result.error.flatten());

const dateOnly = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new ApiError(400, 'INVALID_DATE', 'Ngày giao dịch không hợp lệ.');
  return value.length >= 10 ? value.slice(0, 10) : parsed.toISOString().slice(0, 10);
};

const transactionSelect = `
  SELECT t.id, t.client_id, t.title, t.type, t.amount, t.category_id, t.note,
         t."date", t.payment_method, t.wallet_id, t.target_wallet_id, t.attachments,
         t.created_at, t.updated_at,
         c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
         c.background_color AS category_background_color, c.type AS category_type
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.category_id AND (c.user_id IS NULL OR c.user_id = t.user_id)
`;

const serialize = (row: any) => ({
  id: row.id,
  clientId: row.client_id,
  title: row.title,
  type: row.type,
  amount: Number(row.amount),
  categoryId: row.category_id,
  category: row.category_id ? {
    id: row.category_id,
    name: row.category_name || 'Khác',
    icon: row.category_icon || 'category',
    color: row.category_color || '#64748B',
    backgroundColor: row.category_background_color || '#F1F5F9',
    type: row.category_type || (row.type === 'INCOME' ? 'INCOME' : 'EXPENSE'),
  } : null,
  note: row.note || undefined,
  date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : row.date,
  paymentMethod: row.payment_method,
  walletId: row.wallet_id || undefined,
  targetWalletId: row.target_wallet_id || undefined,
  attachments: row.attachments || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const assertCategory = async (userId: string, categoryId: string | null | undefined, type: string) => {
  if (!categoryId) return;
  const result = await query<{ type: string }>(
    'SELECT type FROM categories WHERE id = $1 AND deleted_at IS NULL AND (user_id IS NULL OR user_id = $2)',
    [categoryId, userId]
  );
  const category = result.rows[0];
  if (!category) throw new ApiError(400, 'CATEGORY_NOT_FOUND', 'Danh mục không tồn tại hoặc không thuộc tài khoản.');
  if (type !== 'TRANSFER' && category.type !== type) {
    throw new ApiError(400, 'CATEGORY_TYPE_MISMATCH', 'Loại danh mục không khớp với loại giao dịch.');
  }
};

router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const values: unknown[] = [userId];
    const filters = ['t.user_id = $1', 't.deleted_at IS NULL'];
    const add = (value: unknown, clause: string) => { values.push(value); filters.push(clause.replace('?', `$${values.length}`)); };
    if (req.query.type && typeof req.query.type === 'string') add(req.query.type, 't.type = ?');
    if (req.query.categoryId && typeof req.query.categoryId === 'string') add(req.query.categoryId, 't.category_id = ?');
    if (req.query.from && typeof req.query.from === 'string') add(dateOnly(req.query.from), 't."date" >= ?::date');
    if (req.query.to && typeof req.query.to === 'string') add(dateOnly(req.query.to), 't."date" <= ?::date');
    if (req.query.search && typeof req.query.search === 'string') {
      values.push(`%${req.query.search.trim()}%`);
      filters.push(`(t.title ILIKE $${values.length} OR COALESCE(t.note, '') ILIKE $${values.length})`);
    }
    const countResult = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM transactions t WHERE ${filters.join(' AND ')}`, values);
    const dataValues = [...values, limit, (page - 1) * limit];
    const rows = await query(`
      ${transactionSelect}
      WHERE ${filters.join(' AND ')}
      ORDER BY t."date" DESC, t.created_at DESC
      LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}
    `, dataValues);
    res.json({ data: rows.rows.map(serialize), meta: { page, limit, total: Number(countResult.rows[0].count) } });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = transactionSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    const data = { ...parsed.data, categoryId: parsed.data.categoryId || (parsed.data.type === 'TRANSFER' ? 'cat_transfer' : null) };
    const date = dateOnly(data.date);
    await assertCategory(req.user!.id, data.categoryId, data.type);
    const inserted = await query(
      `INSERT INTO transactions
        (user_id, client_id, title, type, amount, category_id, note, "date", payment_method, wallet_id, target_wallet_id, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [req.user!.id, data.clientId || null, data.title, data.type, data.amount, data.categoryId || null, data.note || null,
        date, data.paymentMethod, data.walletId || null, data.targetWalletId || null, JSON.stringify(data.attachments)]
    );
    const row = await query(`${transactionSelect} WHERE t.id = $1 AND t.user_id = $2`, [inserted.rows[0].id, req.user!.id]);
    res.status(201).json({ data: serialize(row.rows[0]) });
  } catch (error: any) {
    if (error?.code === '23505') return next(new ApiError(409, 'CLIENT_ID_ALREADY_EXISTS', 'Giao dịch đã được đồng bộ trước đó.'));
    next(error);
  }
});

export const syncTransactionsHandler = async (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
  try {
    const items = z.array(z.record(z.string(), z.unknown())).max(500).safeParse(req.body?.transactions);
    if (!items.success) throw new ApiError(400, 'VALIDATION_ERROR', 'transactions phải là một mảng tối đa 500 phần tử.');
    let count = 0;
    for (const item of items.data) {
      const category = item.category && typeof item.category === 'object' ? item.category as Record<string, unknown> : undefined;
      const parsed = transactionSchema.safeParse({
        ...item,
        categoryId: item.categoryId || category?.id || (item.type === 'TRANSFER' ? 'cat_transfer' : null),
        clientId: item.clientId || item.id || null,
      });
      if (!parsed.success) throw validationError(parsed);
      const data = parsed.data;
      await assertCategory(req.user!.id, data.categoryId, data.type);
      await query(
        `INSERT INTO transactions
          (user_id, client_id, title, type, amount, category_id, note, "date", payment_method, wallet_id, target_wallet_id, attachments)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (user_id, client_id) WHERE client_id IS NOT NULL DO UPDATE SET
           title = EXCLUDED.title, type = EXCLUDED.type, amount = EXCLUDED.amount, category_id = EXCLUDED.category_id,
           note = EXCLUDED.note, "date" = EXCLUDED."date", payment_method = EXCLUDED.payment_method,
           wallet_id = EXCLUDED.wallet_id, target_wallet_id = EXCLUDED.target_wallet_id,
           attachments = EXCLUDED.attachments, updated_at = NOW(), deleted_at = NULL`,
        [req.user!.id, data.clientId || null, data.title, data.type, data.amount, data.categoryId || null, data.note || null,
          dateOnly(data.date), data.paymentMethod, data.walletId || null, data.targetWalletId || null, JSON.stringify(data.attachments)]
      );
      count += 1;
    }
    res.json({ success: true, count });
  } catch (error) { next(error); }
};

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(`${transactionSelect} WHERE t.id = $1 AND t.user_id = $2 AND t.deleted_at IS NULL`, [req.params.id, req.user!.id]);
    if (!result.rows[0]) throw new ApiError(404, 'TRANSACTION_NOT_FOUND', 'Không tìm thấy giao dịch.');
    res.json({ data: serialize(result.rows[0]) });
  } catch (error) { next(error); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    const current = await query<any>('SELECT * FROM transactions WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL', [req.params.id, req.user!.id]);
    if (!current.rows[0]) throw new ApiError(404, 'TRANSACTION_NOT_FOUND', 'Không tìm thấy giao dịch.');
    const data = {
      title: parsed.data.title ?? current.rows[0].title,
      type: parsed.data.type ?? current.rows[0].type,
      amount: parsed.data.amount ?? Number(current.rows[0].amount),
      categoryId: parsed.data.categoryId !== undefined ? parsed.data.categoryId : current.rows[0].category_id,
      note: parsed.data.note !== undefined ? parsed.data.note : current.rows[0].note,
      date: parsed.data.date ?? current.rows[0].date,
      paymentMethod: parsed.data.paymentMethod ?? current.rows[0].payment_method ?? 'CASH',
      walletId: parsed.data.walletId !== undefined ? parsed.data.walletId : current.rows[0].wallet_id,
      targetWalletId: parsed.data.targetWalletId !== undefined ? parsed.data.targetWalletId : current.rows[0].target_wallet_id,
      attachments: parsed.data.attachments ?? current.rows[0].attachments ?? [],
    };
    await assertCategory(req.user!.id, data.categoryId, data.type);
    await query(
      `UPDATE transactions SET title=$1, type=$2, amount=$3, category_id=$4, note=$5, "date"=$6,
       payment_method=$7, wallet_id=$8, target_wallet_id=$9, attachments=$10, updated_at=NOW()
       WHERE id=$11 AND user_id=$12`,
      [data.title, data.type, data.amount, data.categoryId || null, data.note || null, dateOnly(data.date), data.paymentMethod,
        data.walletId || null, data.targetWalletId || null, JSON.stringify(data.attachments || []), req.params.id, req.user!.id]
    );
    const result = await query(`${transactionSelect} WHERE t.id = $1 AND t.user_id = $2`, [req.params.id, req.user!.id]);
    res.json({ data: serialize(result.rows[0]) });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE transactions SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id',
      [req.params.id, req.user!.id]
    );
    if (!result.rows[0]) throw new ApiError(404, 'TRANSACTION_NOT_FOUND', 'Không tìm thấy giao dịch.');
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;
