import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { ApiError } from '../errors';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);
const recurringSchema = z.object({
  id: z.string().trim().max(120).optional(),
  title: z.string().trim().min(1).max(200),
  amount: z.coerce.number().positive(),
  type: z.enum(['EXPENSE', 'INCOME']),
  categoryId: z.string().trim().min(1).max(80),
  walletId: z.string().trim().min(1).max(120),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  dayOfMonth: z.coerce.number().int().min(1).max(31),
  status: z.enum(['ACTIVE', 'PAUSED']).default('ACTIVE'),
  nextDueDate: z.string().trim().min(1).max(40),
  note: z.string().trim().max(2000).nullable().optional(),
});
const recurringPatchSchema = recurringSchema.omit({ id: true }).partial();
const validationError = (result: { success: false; error: z.ZodError }) =>
  new ApiError(400, 'VALIDATION_ERROR', 'Dữ liệu khoản định kỳ không hợp lệ.', result.error.flatten());
const dateOnly = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, 'INVALID_DATE', 'Ngày đến hạn không hợp lệ.');
  return value.slice(0, 10);
};
const serialize = (row: any) => ({
  id: row.id,
  title: row.title,
  amount: Number(row.amount),
  type: row.type,
  categoryId: row.category_id,
  walletId: row.wallet_id,
  frequency: row.frequency,
  dayOfMonth: row.day_of_month,
  status: row.status,
  nextDueDate: row.next_due_date instanceof Date ? row.next_due_date.toISOString().slice(0, 10) : row.next_due_date,
  note: row.note || undefined,
});
const select = `SELECT id, title, amount, type, category_id, wallet_id, frequency, day_of_month, status, next_due_date, note FROM recurring_transactions`;

router.get('/', async (req, res, next) => {
  try {
    const result = await query(`${select} WHERE user_id=$1 AND deleted_at IS NULL ORDER BY next_due_date ASC`, [req.user!.id]);
    res.json({ data: result.rows.map(serialize) });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = recurringSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    const data = parsed.data;
    const id = data.id || `rec_${crypto.randomUUID()}`;
    const result = await query(
      `INSERT INTO recurring_transactions (user_id, id, title, amount, type, category_id, wallet_id, frequency, day_of_month, status, next_due_date, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::date, $12)
       RETURNING id`,
      [req.user!.id, id, data.title, data.amount, data.type, data.categoryId, data.walletId, data.frequency, data.dayOfMonth, data.status, dateOnly(data.nextDueDate), data.note || null]
    );
    const row = await query(`${select} WHERE user_id=$1 AND id=$2`, [req.user!.id, result.rows[0].id]);
    res.status(201).json({ data: serialize(row.rows[0]) });
  } catch (error: any) {
    if (error?.code === '23505') return next(new ApiError(409, 'RECURRING_ALREADY_EXISTS', 'Khoản định kỳ này đã tồn tại.'));
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const parsed = recurringPatchSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    const current = await query<any>('SELECT * FROM recurring_transactions WHERE user_id=$1 AND id=$2 AND deleted_at IS NULL', [req.user!.id, req.params.id]);
    if (!current.rows[0]) throw new ApiError(404, 'RECURRING_NOT_FOUND', 'Không tìm thấy khoản định kỳ.');
    const row = current.rows[0];
    const data = {
      title: parsed.data.title ?? row.title,
      amount: parsed.data.amount ?? Number(row.amount),
      type: parsed.data.type ?? row.type,
      categoryId: parsed.data.categoryId ?? row.category_id,
      walletId: parsed.data.walletId ?? row.wallet_id,
      frequency: parsed.data.frequency ?? row.frequency,
      dayOfMonth: parsed.data.dayOfMonth ?? row.day_of_month,
      status: parsed.data.status ?? row.status,
      nextDueDate: parsed.data.nextDueDate ?? row.next_due_date,
      note: parsed.data.note !== undefined ? parsed.data.note : row.note,
    };
    await query(
      `UPDATE recurring_transactions SET title=$1, amount=$2, type=$3, category_id=$4, wallet_id=$5, frequency=$6,
       day_of_month=$7, status=$8, next_due_date=$9::date, note=$10, updated_at=NOW()
       WHERE user_id=$11 AND id=$12`,
      [data.title, data.amount, data.type, data.categoryId, data.walletId, data.frequency, data.dayOfMonth, data.status, dateOnly(data.nextDueDate instanceof Date ? data.nextDueDate.toISOString() : data.nextDueDate), data.note || null, req.user!.id, req.params.id]
    );
    const result = await query(`${select} WHERE user_id=$1 AND id=$2`, [req.user!.id, req.params.id]);
    res.json({ data: serialize(result.rows[0]) });
  } catch (error) { next(error); }
});

router.post('/:id/toggle', async (req, res, next) => {
  try {
    const result = await query(`${select} WHERE user_id=$1 AND id=$2 AND deleted_at IS NULL`, [req.user!.id, req.params.id]);
    if (!result.rows[0]) throw new ApiError(404, 'RECURRING_NOT_FOUND', 'Không tìm thấy khoản định kỳ.');
    const updated = await query(
      `UPDATE recurring_transactions SET status=CASE WHEN status='ACTIVE' THEN 'PAUSED' ELSE 'ACTIVE' END, updated_at=NOW()
       WHERE user_id=$1 AND id=$2 RETURNING id`, [req.user!.id, req.params.id]
    );
    const row = await query(`${select} WHERE user_id=$1 AND id=$2`, [req.user!.id, updated.rows[0].id]);
    res.json({ data: serialize(row.rows[0]) });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('UPDATE recurring_transactions SET deleted_at=NOW(), updated_at=NOW() WHERE user_id=$1 AND id=$2 AND deleted_at IS NULL RETURNING id', [req.user!.id, req.params.id]);
    if (!result.rows[0]) throw new ApiError(404, 'RECURRING_NOT_FOUND', 'Không tìm thấy khoản định kỳ.');
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;
