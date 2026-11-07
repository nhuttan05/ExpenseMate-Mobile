import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { pool, query } from '../db';
import { ApiError } from '../errors';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

const walletTypes = z.enum(['CASH', 'BANK', 'E_WALLET', 'SAVINGS', 'CREDIT']);
const walletSchema = z.object({
  id: z.string().trim().max(120).optional(),
  name: z.string().trim().min(1).max(120),
  type: walletTypes,
  balance: z.coerce.number().finite(),
  currency: z.string().trim().max(10).default('VND'),
  icon: z.string().trim().max(80).default('account-balance-wallet'),
  color: z.string().trim().max(20).default('#2563EB'),
  backgroundColor: z.string().trim().max(20).default('#DBEAFE'),
  accountNumber: z.string().trim().max(120).nullable().optional(),
  creditLimit: z.coerce.number().nonnegative().nullable().optional(),
  isExcludedFromTotal: z.boolean().default(false),
});
const validationError = (result: { success: false; error: z.ZodError }) =>
  new ApiError(400, 'VALIDATION_ERROR', 'Dữ liệu ví không hợp lệ.', result.error.flatten());
const serializeWallet = (row: any) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  balance: Number(row.balance),
  currency: row.currency,
  icon: row.icon,
  color: row.color,
  backgroundColor: row.background_color,
  accountNumber: row.account_number || undefined,
  creditLimit: row.credit_limit === null || row.credit_limit === undefined ? undefined : Number(row.credit_limit),
  isExcludedFromTotal: Boolean(row.is_excluded_from_total),
});
const walletSelect = `SELECT id, name, type, balance, currency, icon, color, background_color,
  account_number, credit_limit, is_excluded_from_total FROM wallets`;

const jarDefaults = [
  ['NEC', 'Necessities', 'Thiết yếu', 55, '#2563EB', 'home', 'Chi phí thiết yếu hàng ngày'],
  ['FFA', 'Financial Freedom', 'Tự do tài chính', 10, '#16A34A', 'trending-up', 'Tiết kiệm và đầu tư'],
  ['EDU', 'Education', 'Giáo dục', 10, '#7C3AED', 'school', 'Học tập và phát triển'],
  ['LTSS', 'Long Term Savings', 'Tiết kiệm dài hạn', 10, '#0891B2', 'savings', 'Mục tiêu dài hạn'],
  ['PLAY', 'Play', 'Hưởng thụ', 10, '#EA580C', 'sports-esports', 'Giải trí và trải nghiệm'],
  ['GIVE', 'Give', 'Cho đi', 5, '#DB2777', 'volunteer-activism', 'Chia sẻ với cộng đồng'],
] as const;

const ensureJars = async (userId: string) => {
  for (const [code, name, vietnameseName, percentage, color, icon, description] of jarDefaults) {
    await query(
      `INSERT INTO jars (user_id, code, name, vietnamese_name, percentage, color, icon, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (user_id, code) DO NOTHING`,
      [userId, code, name, vietnameseName, percentage, color, icon, description]
    );
  }
};

router.get('/', async (req, res, next) => {
  try {
    const result = await query(`${walletSelect} WHERE user_id=$1 AND deleted_at IS NULL ORDER BY balance DESC`, [req.user!.id]);
    res.json({ data: result.rows.map(serializeWallet) });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = walletSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    const data = parsed.data;
    const id = data.id || `wallet_${crypto.randomUUID()}`;
    const result = await query(
      `INSERT INTO wallets (user_id, id, name, type, balance, currency, icon, color, background_color, account_number, credit_limit, is_excluded_from_total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, name, type, balance, currency, icon, color, background_color, account_number, credit_limit, is_excluded_from_total`,
      [req.user!.id, id, data.name, data.type, data.balance, data.currency, data.icon, data.color, data.backgroundColor,
        data.accountNumber || null, data.creditLimit ?? null, data.isExcludedFromTotal]
    );
    res.status(201).json({ data: serializeWallet(result.rows[0]) });
  } catch (error: any) {
    if (error?.code === '23505') return next(new ApiError(409, 'WALLET_ALREADY_EXISTS', 'Ví này đã tồn tại.'));
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const parsed = walletSchema.partial().safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    const current = await query<any>('SELECT * FROM wallets WHERE user_id=$1 AND id=$2 AND deleted_at IS NULL', [req.user!.id, req.params.id]);
    if (!current.rows[0]) throw new ApiError(404, 'WALLET_NOT_FOUND', 'Không tìm thấy ví.');
    const row = current.rows[0];
    const data = {
      name: parsed.data.name ?? row.name,
      type: parsed.data.type ?? row.type,
      balance: parsed.data.balance ?? Number(row.balance),
      currency: parsed.data.currency ?? row.currency,
      icon: parsed.data.icon ?? row.icon,
      color: parsed.data.color ?? row.color,
      backgroundColor: parsed.data.backgroundColor ?? row.background_color,
      accountNumber: parsed.data.accountNumber !== undefined ? parsed.data.accountNumber : row.account_number,
      creditLimit: parsed.data.creditLimit !== undefined ? parsed.data.creditLimit : row.credit_limit,
      isExcludedFromTotal: parsed.data.isExcludedFromTotal ?? row.is_excluded_from_total,
    };
    const result = await query(
      `UPDATE wallets SET name=$1, type=$2, balance=$3, currency=$4, icon=$5, color=$6, background_color=$7,
       account_number=$8, credit_limit=$9, is_excluded_from_total=$10, updated_at=NOW()
       WHERE user_id=$11 AND id=$12 RETURNING id, name, type, balance, currency, icon, color, background_color, account_number, credit_limit, is_excluded_from_total`,
      [data.name, data.type, data.balance, data.currency, data.icon, data.color, data.backgroundColor, data.accountNumber || null,
        data.creditLimit ?? null, data.isExcludedFromTotal, req.user!.id, req.params.id]
    );
    res.json({ data: serializeWallet(result.rows[0]) });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('UPDATE wallets SET deleted_at=NOW(), updated_at=NOW() WHERE user_id=$1 AND id=$2 AND deleted_at IS NULL RETURNING id', [req.user!.id, req.params.id]);
    if (!result.rows[0]) throw new ApiError(404, 'WALLET_NOT_FOUND', 'Không tìm thấy ví.');
    res.status(204).send();
  } catch (error) { next(error); }
});

router.get('/jars', async (req, res, next) => {
  try {
    await ensureJars(req.user!.id);
    const result = await query(
      `SELECT code, name, vietnamese_name, percentage, allocated_amount, spent_amount, color, icon, description
       FROM jars WHERE user_id=$1 ORDER BY percentage DESC`, [req.user!.id]
    );
    res.json({ data: result.rows.map((row) => ({
      id: `${req.user!.id}_${row.code}`,
      code: row.code,
      name: row.name,
      vietnameseName: row.vietnamese_name,
      percentage: Number(row.percentage),
      allocatedAmount: Number(row.allocated_amount),
      spentAmount: Number(row.spent_amount),
      color: row.color,
      icon: row.icon,
      description: row.description,
    })) });
  } catch (error) { next(error); }
});

router.patch('/jars/:code', async (req, res, next) => {
  try {
    const parsed = z.object({ percentage: z.coerce.number().min(0).max(100), allocatedAmount: z.coerce.number().nonnegative() }).safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    await ensureJars(req.user!.id);
    const result = await query(
      `UPDATE jars SET percentage=$1, allocated_amount=$2, updated_at=NOW()
       WHERE user_id=$3 AND code=$4 RETURNING code, percentage, allocated_amount`,
      [parsed.data.percentage, parsed.data.allocatedAmount, req.user!.id, req.params.code]
    );
    if (!result.rows[0]) throw new ApiError(404, 'JAR_NOT_FOUND', 'Không tìm thấy hũ tài chính.');
    res.json({ data: { code: result.rows[0].code, percentage: Number(result.rows[0].percentage), allocatedAmount: Number(result.rows[0].allocated_amount) } });
  } catch (error) { next(error); }
});

router.post('/:id/transfer', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const parsed = z.object({ toWalletId: z.string().trim().min(1).max(120), amount: z.coerce.number().positive(), fee: z.coerce.number().nonnegative().default(0), note: z.string().trim().max(2000).nullable().optional() }).safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    if (parsed.data.toWalletId === req.params.id) throw new ApiError(400, 'SAME_WALLET', 'Ví nguồn và ví đích phải khác nhau.');
    await client.query('BEGIN');
    const wallets = await client.query<any>('SELECT id, name, type, balance FROM wallets WHERE user_id=$1 AND id = ANY($2::varchar[]) AND deleted_at IS NULL FOR UPDATE', [req.user!.id, [req.params.id, parsed.data.toWalletId]]);
    if (wallets.rows.length !== 2) throw new ApiError(404, 'WALLET_NOT_FOUND', 'Không tìm thấy ví nguồn hoặc ví đích.');
    const from = wallets.rows.find((wallet) => wallet.id === req.params.id);
    if (from.type !== 'CREDIT' && Number(from.balance) < parsed.data.amount + parsed.data.fee) throw new ApiError(400, 'INSUFFICIENT_BALANCE', 'Số dư ví nguồn không đủ.');
    await client.query('UPDATE wallets SET balance=balance-$1, updated_at=NOW() WHERE user_id=$2 AND id=$3', [parsed.data.amount + parsed.data.fee, req.user!.id, req.params.id]);
    await client.query('UPDATE wallets SET balance=balance+$1, updated_at=NOW() WHERE user_id=$2 AND id=$3', [parsed.data.amount, req.user!.id, parsed.data.toWalletId]);
    await client.query(
      `INSERT INTO transactions (user_id, client_id, title, type, amount, category_id, note, "date", payment_method, wallet_id, target_wallet_id)
       VALUES ($1, $2, $3, 'TRANSFER', $4, 'cat_transfer', $5, CURRENT_DATE, 'INTERNAL_TRANSFER', $6, $7)`,
      [req.user!.id, `transfer_${crypto.randomUUID()}`, `Chuyển ví: ${from.name} → ${wallets.rows.find((wallet) => wallet.id === parsed.data.toWalletId).name}`, parsed.data.amount,
        parsed.data.note || (parsed.data.fee ? `Phí chuyển: ${parsed.data.fee}` : null), req.params.id, parsed.data.toWalletId]
    );
    await client.query('COMMIT');
    const updated = await query(`${walletSelect} WHERE user_id=$1 AND id = ANY($2::varchar[]) AND deleted_at IS NULL ORDER BY balance DESC`, [req.user!.id, [req.params.id, parsed.data.toWalletId]]);
    res.json({ data: { wallets: updated.rows.map(serializeWallet) } });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally { client.release(); }
});

export default router;
