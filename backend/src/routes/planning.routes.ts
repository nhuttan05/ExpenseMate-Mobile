import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { ApiError } from '../errors';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);
const validationError = (result: { success: false; error: z.ZodError }) =>
  new ApiError(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ.', result.error.flatten());
const dateOnly = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, 'INVALID_DATE', 'Ngày không hợp lệ.');
  return value.slice(0, 10);
};

const debtSchema = z.object({
  id: z.string().trim().max(120).optional(),
  personName: z.string().trim().min(1).max(160),
  amount: z.coerce.number().positive(),
  type: z.enum(['LENT', 'BORROWED']),
  dueDate: z.string().trim().min(1).max(40),
  status: z.enum(['PENDING', 'SETTLED']).default('PENDING'),
  note: z.string().trim().max(2000).nullable().optional(),
  phoneNumber: z.string().trim().max(40).nullable().optional(),
});
const serializeDebt = (row: any) => ({
  id: row.id,
  personName: row.person_name,
  amount: Number(row.amount),
  type: row.type,
  dueDate: row.due_date instanceof Date ? row.due_date.toISOString().slice(0, 10) : row.due_date,
  status: row.status,
  note: row.note || undefined,
  createdAt: row.created_at,
  phoneNumber: row.phone_number || undefined,
});
const debtSelect = 'SELECT id, person_name, amount, type, due_date, status, note, created_at, phone_number FROM debts_loans';

const debtRouter = Router();
debtRouter.use(requireAuth);
debtRouter.get('/', async (req, res, next) => {
  try {
    const result = await query(`${debtSelect} WHERE user_id=$1 AND deleted_at IS NULL ORDER BY status DESC, due_date ASC`, [req.user!.id]);
    res.json({ data: result.rows.map(serializeDebt) });
  } catch (error) { next(error); }
});
debtRouter.post('/', async (req, res, next) => {
  try {
    const parsed = debtSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    const data = parsed.data;
    const id = data.id || `debt_${crypto.randomUUID()}`;
    const result = await query(
      `INSERT INTO debts_loans (user_id, id, person_name, amount, type, due_date, status, note, phone_number)
       VALUES ($1, $2, $3, $4, $5, $6::date, $7, $8, $9) RETURNING id`,
      [req.user!.id, id, data.personName, data.amount, data.type, dateOnly(data.dueDate), data.status, data.note || null, data.phoneNumber || null]
    );
    const row = await query(`${debtSelect} WHERE user_id=$1 AND id=$2`, [req.user!.id, result.rows[0].id]);
    res.status(201).json({ data: serializeDebt(row.rows[0]) });
  } catch (error: any) {
    if (error?.code === '23505') return next(new ApiError(409, 'DEBT_ALREADY_EXISTS', 'Khoản công nợ này đã tồn tại.'));
    next(error);
  }
});
debtRouter.post('/:id/settle', async (req, res, next) => {
  try {
    const result = await query(`${debtSelect} WHERE user_id=$1 AND id=$2 AND deleted_at IS NULL`, [req.user!.id, req.params.id]);
    if (!result.rows[0]) throw new ApiError(404, 'DEBT_NOT_FOUND', 'Không tìm thấy khoản công nợ.');
    await query("UPDATE debts_loans SET status='SETTLED', updated_at=NOW() WHERE user_id=$1 AND id=$2", [req.user!.id, req.params.id]);
    const updated = await query(`${debtSelect} WHERE user_id=$1 AND id=$2`, [req.user!.id, req.params.id]);
    res.json({ data: serializeDebt(updated.rows[0]) });
  } catch (error) { next(error); }
});
debtRouter.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('UPDATE debts_loans SET deleted_at=NOW(), updated_at=NOW() WHERE user_id=$1 AND id=$2 AND deleted_at IS NULL RETURNING id', [req.user!.id, req.params.id]);
    if (!result.rows[0]) throw new ApiError(404, 'DEBT_NOT_FOUND', 'Không tìm thấy khoản công nợ.');
    res.status(204).send();
  } catch (error) { next(error); }
});

const scenarioSchema = z.object({
  id: z.string().trim().max(120).optional(),
  title: z.string().trim().min(1).max(200),
  targetAmount: z.coerce.number().positive(),
  durationMonths: z.coerce.number().int().positive().max(360),
  income: z.coerce.number().nonnegative(),
  expense: z.coerce.number().nonnegative(),
  balance: z.coerce.number(),
  category: z.string().trim().max(120).default('Mua sắm'),
});
const serializeScenario = (row: any) => ({
  id: row.id,
  title: row.title,
  targetAmount: Number(row.target_amount),
  monthlyPayment: row.monthly_payment === null ? undefined : Number(row.monthly_payment),
  durationMonths: row.duration_months || undefined,
  category: row.category,
  impactAssessment: row.impact_assessment,
  recommendation: row.recommendation,
  feasibilityScore: Number(row.feasibility_score),
  safeToBuy: Boolean(row.safe_to_buy),
});
const scenarioSelect = 'SELECT id, title, target_amount, monthly_payment, duration_months, category, impact_assessment, recommendation, feasibility_score, safe_to_buy FROM whatif_scenarios';

const scenarioRouter = Router();
scenarioRouter.use(requireAuth);
scenarioRouter.get('/', async (req, res, next) => {
  try {
    const result = await query(`${scenarioSelect} WHERE user_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC`, [req.user!.id]);
    res.json({ data: result.rows.map(serializeScenario) });
  } catch (error) { next(error); }
});
scenarioRouter.post('/simulate', async (req, res, next) => {
  try {
    const parsed = scenarioSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    const data = parsed.data;
    const monthlyPayment = data.targetAmount / data.durationMonths;
    const disposable = data.income - data.expense;
    const paymentRatio = data.income > 0 ? monthlyPayment / data.income : 1;
    const feasibilityScore = Math.max(0, Math.min(100, Math.round((disposable > 0 ? Math.min(1, disposable / Math.max(monthlyPayment, 1)) : 0) * 100)));
    const safeToBuy = data.balance >= data.targetAmount * 0.3 && paymentRatio <= 0.3 && disposable >= monthlyPayment;
    const impactAssessment = safeToBuy
      ? 'Khoản chi nằm trong khả năng cân đối hiện tại nếu bạn duy trì thu nhập và chi phí như đã nhập.'
      : 'Khoản chi có thể tạo áp lực lên dòng tiền hoặc quỹ dự phòng hiện tại.';
    const recommendation = safeToBuy
      ? `Có thể thực hiện, nhưng nên giữ lại ít nhất ${Math.round(data.expense * 3).toLocaleString('vi-VN')} đồng làm quỹ dự phòng.`
      : `Nên tăng thời gian tích lũy hoặc giảm mục tiêu xuống khoảng ${Math.round(Math.max(0, disposable) * data.durationMonths).toLocaleString('vi-VN')} đồng.`;
    const id = data.id || `scenario_${crypto.randomUUID()}`;
    const result = await query(
      `INSERT INTO whatif_scenarios (user_id, id, title, target_amount, monthly_payment, duration_months, category, impact_assessment, recommendation, feasibility_score, safe_to_buy)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [req.user!.id, id, data.title, data.targetAmount, monthlyPayment, data.durationMonths, data.category, impactAssessment, recommendation, feasibilityScore, safeToBuy]
    );
    const row = await query(`${scenarioSelect} WHERE user_id=$1 AND id=$2`, [req.user!.id, result.rows[0].id]);
    res.status(201).json({ data: serializeScenario(row.rows[0]) });
  } catch (error: any) {
    if (error?.code === '23505') return next(new ApiError(409, 'SCENARIO_ALREADY_EXISTS', 'Kịch bản này đã tồn tại.'));
    next(error);
  }
});
scenarioRouter.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('UPDATE whatif_scenarios SET deleted_at=NOW(), updated_at=NOW() WHERE user_id=$1 AND id=$2 AND deleted_at IS NULL RETURNING id', [req.user!.id, req.params.id]);
    if (!result.rows[0]) throw new ApiError(404, 'SCENARIO_NOT_FOUND', 'Không tìm thấy kịch bản.');
    res.status(204).send();
  } catch (error) { next(error); }
});

const challengeDefaults = [
  ['no-coffee', 'Không cà phê ngoài', 'Tự pha cà phê tại nhà trong thời gian thử thách.', 7, 350000, 'local-cafe', 'Không cà phê 7 ngày'],
  ['no-shopping', 'Không mua sắm bốc đồng', 'Tạm dừng các khoản mua sắm không nằm trong kế hoạch.', 14, 1000000, 'shopping-bag', 'Kỷ luật chi tiêu'],
  ['save-daily', 'Tiết kiệm mỗi ngày', 'Ghi nhận một khoản tiết kiệm nhỏ mỗi ngày.', 30, 1500000, 'savings', 'Người tiết kiệm bền bỉ'],
] as const;
const ensureChallenges = async (userId: string) => {
  for (const [id, title, description, targetDays, potentialSavings, icon, badgeName] of challengeDefaults) {
    await query(
      `INSERT INTO challenges (user_id, id, title, description, target_days, potential_savings, icon, badge_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (user_id, id) DO NOTHING`,
      [userId, id, title, description, targetDays, potentialSavings, icon, badgeName]
    );
  }
};
const serializeChallenge = (row: any) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  targetDays: row.target_days,
  currentDays: row.current_days,
  potentialSavings: Number(row.potential_savings),
  icon: row.icon,
  status: row.status,
  badgeName: row.badge_name,
});
const challengeSelect = 'SELECT id, title, description, target_days, current_days, potential_savings, icon, status, badge_name FROM challenges';
const challengeRouter = Router();
challengeRouter.use(requireAuth);
challengeRouter.get('/', async (req, res, next) => {
  try {
    await ensureChallenges(req.user!.id);
    const result = await query(`${challengeSelect} WHERE user_id=$1 ORDER BY target_days ASC`, [req.user!.id]);
    res.json({ data: result.rows.map(serializeChallenge) });
  } catch (error) { next(error); }
});
challengeRouter.post('/:id/check-in', async (req, res, next) => {
  try {
    await ensureChallenges(req.user!.id);
    const result = await query(
      `UPDATE challenges SET current_days=LEAST(target_days, current_days+1),
       status=CASE WHEN current_days+1 >= target_days THEN 'COMPLETED' ELSE 'IN_PROGRESS' END, updated_at=NOW()
       WHERE user_id=$1 AND id=$2 RETURNING id, title, description, target_days, current_days, potential_savings, icon, status, badge_name`,
      [req.user!.id, req.params.id]
    );
    if (!result.rows[0]) throw new ApiError(404, 'CHALLENGE_NOT_FOUND', 'Không tìm thấy thử thách.');
    res.json({ data: serializeChallenge(result.rows[0]) });
  } catch (error) { next(error); }
});

router.use('/debts', debtRouter);
router.use('/scenarios', scenarioRouter);
router.use('/challenges', challengeRouter);

export default router;
