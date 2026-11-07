import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { ApiError } from '../errors';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

const notificationSchema = z.object({
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(2000),
  type: z.string().trim().max(40).default('INFO'),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
});
const validationError = (result: { success: false; error: z.ZodError }) =>
  new ApiError(400, 'VALIDATION_ERROR', 'Dữ liệu thông báo không hợp lệ.', result.error.flatten());
const serialize = (row: any) => ({
  id: row.id,
  title: row.title,
  message: row.message,
  type: row.type,
  dueAt: row.due_at,
  readAt: row.read_at,
  createdAt: row.created_at,
  isRead: Boolean(row.read_at),
});

router.get('/', async (req, res, next) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const result = await query(
      `SELECT id, title, message, type, due_at, read_at, created_at
       FROM notifications WHERE user_id=$1 ${unreadOnly ? 'AND read_at IS NULL' : ''}
       ORDER BY created_at DESC LIMIT 100`,
      [req.user!.id]
    );
    res.json({ data: result.rows.map(serialize) });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = notificationSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    const data = parsed.data;
    const result = await query(
      `INSERT INTO notifications (user_id, title, message, type, due_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, title, message, type, due_at, read_at, created_at`,
      [req.user!.id, data.title, data.message, data.type, data.dueAt || null]
    );
    res.status(201).json({ data: serialize(result.rows[0]) });
  } catch (error) { next(error); }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE notifications SET read_at=COALESCE(read_at, NOW())
       WHERE id=$1 AND user_id=$2 RETURNING id, title, message, type, due_at, read_at, created_at`,
      [req.params.id, req.user!.id]
    );
    if (!result.rows[0]) throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', 'Không tìm thấy thông báo.');
    res.json({ data: serialize(result.rows[0]) });
  } catch (error) { next(error); }
});

router.post('/read-all', async (req, res, next) => {
  try {
    const result = await query('UPDATE notifications SET read_at=COALESCE(read_at, NOW()) WHERE user_id=$1 AND read_at IS NULL', [req.user!.id]);
    res.json({ data: { updated: result.rowCount || 0 } });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM notifications WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user!.id]);
    if (!result.rows[0]) throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', 'Không tìm thấy thông báo.');
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;
