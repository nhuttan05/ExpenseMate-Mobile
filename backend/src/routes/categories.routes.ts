import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { query } from '../db';
import { ApiError } from '../errors';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

const categorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  icon: z.string().trim().max(80).default('category'),
  color: z.string().trim().max(20).default('#2563EB'),
  backgroundColor: z.string().trim().max(20).default('#DBEAFE'),
  type: z.enum(['INCOME', 'EXPENSE']),
});
const validationError = (result: { success: false; error: z.ZodError }) =>
  new ApiError(400, 'VALIDATION_ERROR', 'Dữ liệu danh mục không hợp lệ.', result.error.flatten());
const serialize = (row: any) => ({
  id: row.id,
  name: row.name,
  icon: row.icon,
  color: row.color,
  backgroundColor: row.background_color,
  type: row.type,
});

router.get('/', async (req, res, next) => {
  try {
    const values: unknown[] = [req.user!.id];
    let sql = `SELECT id, name, icon, color, background_color, type FROM categories
      WHERE deleted_at IS NULL AND (user_id IS NULL OR user_id = $1)`;
    if (req.query.type === 'INCOME' || req.query.type === 'EXPENSE') {
      values.push(req.query.type);
      sql += ` AND type = $${values.length}`;
    }
    sql += ' ORDER BY user_id NULLS FIRST, name ASC';
    const result = await query(sql, values);
    res.json({ data: result.rows.map(serialize) });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    const data = parsed.data;
    const id = `cat_${crypto.randomUUID()}`;
    const result = await query(
      `INSERT INTO categories (id, user_id, name, icon, color, background_color, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, icon, color, background_color, type`,
      [id, req.user!.id, data.name, data.icon, data.color, data.backgroundColor, data.type]
    );
    res.status(201).json({ data: serialize(result.rows[0]) });
  } catch (error: any) {
    if (error?.code === '23505') return next(new ApiError(409, 'CATEGORY_ALREADY_EXISTS', 'Danh mục cùng tên đã tồn tại.'));
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const parsed = categorySchema.partial().safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    const current = await query<any>('SELECT * FROM categories WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL', [req.params.id, req.user!.id]);
    if (!current.rows[0]) throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục tùy chỉnh.');
    const data = { ...current.rows[0], ...parsed.data };
    const result = await query(
      `UPDATE categories SET name=$1, icon=$2, color=$3, background_color=$4, type=$5, updated_at=NOW()
       WHERE id=$6 AND user_id=$7 RETURNING id, name, icon, color, background_color, type`,
      [data.name, data.icon, data.color, data.backgroundColor || data.background_color, data.type, req.params.id, req.user!.id]
    );
    res.json({ data: serialize(result.rows[0]) });
  } catch (error: any) {
    if (error?.code === '23505') return next(new ApiError(409, 'CATEGORY_ALREADY_EXISTS', 'Danh mục cùng tên đã tồn tại.'));
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE categories SET deleted_at=NOW(), updated_at=NOW() WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL RETURNING id',
      [req.params.id, req.user!.id]
    );
    if (!result.rows[0]) throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục tùy chỉnh.');
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;
