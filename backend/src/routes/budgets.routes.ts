import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { ApiError } from '../errors';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const normalizeMonth = (value: unknown): string => {
  const candidate = value instanceof Date ? value.toISOString().slice(0, 7) : (typeof value === 'string' && value ? value : new Date().toISOString().slice(0, 7));
  if (monthPattern.test(candidate)) return `${candidate}-01`;
  const legacy = /^(0?[1-9]|1[0-2])\/(\d{4})$/.exec(candidate);
  if (legacy) return `${legacy[2]}-${legacy[1].padStart(2, '0')}-01`;
  throw new ApiError(400, 'INVALID_MONTH', 'Tháng phải có định dạng YYYY-MM.');
};

const budgetSchema = z.object({
  categoryId: z.string().trim().min(1).max(80),
  month: z.string().trim().min(1).default(() => new Date().toISOString().slice(0, 7)),
  allocatedAmount: z.coerce.number().nonnegative().finite(),
  color: z.string().trim().max(20).default('#2563EB'),
});
const validationError = (result: { success: false; error: z.ZodError }) =>
  new ApiError(400, 'VALIDATION_ERROR', 'Dữ liệu ngân sách không hợp lệ.', result.error.flatten());
const serialize = (row: any) => ({
  id: row.id,
  categoryId: row.category_id,
  categoryName: row.category_name || 'Khác',
  allocatedAmount: Number(row.allocated_amount),
  spentAmount: Number(row.spent_amount || 0),
  month: row.month_key,
  color: row.color,
});
const budgetSelect = `
  SELECT b.id, b.category_id, b.allocated_amount, b.color,
    to_char(b.month, 'YYYY-MM') AS month_key,
    c.name AS category_name,
    COALESCE((SELECT SUM(t.amount) FROM transactions t
      WHERE t.user_id = b.user_id AND t.category_id = b.category_id AND t.type = 'EXPENSE'
        AND t.deleted_at IS NULL AND t."date" >= b.month AND t."date" < b.month + INTERVAL '1 month'), 0) AS spent_amount
  FROM budgets b
  LEFT JOIN categories c ON c.id = b.category_id AND (c.user_id IS NULL OR c.user_id = b.user_id)
`;

const assertCategory = async (userId: string, categoryId: string) => {
  const result = await query('SELECT id FROM categories WHERE id=$1 AND deleted_at IS NULL AND (user_id IS NULL OR user_id=$2)', [categoryId, userId]);
  if (!result.rows[0]) throw new ApiError(400, 'CATEGORY_NOT_FOUND', 'Danh mục không tồn tại hoặc không thuộc tài khoản.');
};

router.get('/', async (req, res, next) => {
  try {
    const month = normalizeMonth(typeof req.query.month === 'string' ? req.query.month : undefined);
    const result = await query(`${budgetSelect} WHERE b.user_id=$1 AND b.month=$2::date AND b.deleted_at IS NULL ORDER BY category_name`, [req.user!.id, month]);
    res.json({ data: result.rows.map(serialize) });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = budgetSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    const data = parsed.data;
    const month = normalizeMonth(data.month);
    await assertCategory(req.user!.id, data.categoryId);
    const result = await query(
      `INSERT INTO budgets (user_id, category_id, month, allocated_amount, color)
       VALUES ($1, $2, $3::date, $4, $5) RETURNING id`,
      [req.user!.id, data.categoryId, month, data.allocatedAmount, data.color]
    );
    const budget = await query(`${budgetSelect} WHERE b.id=$1`, [result.rows[0].id]);
    res.status(201).json({ data: serialize(budget.rows[0]) });
  } catch (error: any) {
    if (error?.code === '23505') return next(new ApiError(409, 'BUDGET_ALREADY_EXISTS', 'Ngân sách cho danh mục và tháng này đã tồn tại.'));
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const parsed = budgetSchema.partial().safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    const current = await query<any>('SELECT * FROM budgets WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL', [req.params.id, req.user!.id]);
    if (!current.rows[0]) throw new ApiError(404, 'BUDGET_NOT_FOUND', 'Không tìm thấy ngân sách.');
    const data = {
      categoryId: parsed.data.categoryId ?? current.rows[0].category_id,
      month: parsed.data.month ?? current.rows[0].month,
      allocatedAmount: parsed.data.allocatedAmount ?? Number(current.rows[0].allocated_amount),
      color: parsed.data.color ?? current.rows[0].color,
    };
    const month = normalizeMonth(data.month);
    await assertCategory(req.user!.id, data.categoryId);
    const result = await query(
      `UPDATE budgets SET category_id=$1, month=$2::date, allocated_amount=$3, color=$4, updated_at=NOW()
       WHERE id=$5 AND user_id=$6 RETURNING id`,
      [data.categoryId, month, data.allocatedAmount, data.color, req.params.id, req.user!.id]
    );
    const budget = await query(`${budgetSelect} WHERE b.id=$1`, [result.rows[0].id]);
    res.json({ data: serialize(budget.rows[0]) });
  } catch (error: any) {
    if (error?.code === '23505') return next(new ApiError(409, 'BUDGET_ALREADY_EXISTS', 'Ngân sách cho danh mục và tháng này đã tồn tại.'));
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('UPDATE budgets SET deleted_at=NOW(), updated_at=NOW() WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL RETURNING id', [req.params.id, req.user!.id]);
    if (!result.rows[0]) throw new ApiError(404, 'BUDGET_NOT_FOUND', 'Không tìm thấy ngân sách.');
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;
