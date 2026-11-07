import { Router } from 'express';
import { query } from '../db';
import { ApiError } from '../errors';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const monthStart = (value: unknown): string => {
  const candidate = typeof value === 'string' && value ? value : new Date().toISOString().slice(0, 7);
  if (!monthPattern.test(candidate)) throw new ApiError(400, 'INVALID_MONTH', 'Tháng phải có định dạng YYYY-MM.');
  return `${candidate}-01`;
};

router.get('/monthly', async (req, res, next) => {
  try {
    const month = monthStart(req.query.month);
    const userId = req.user!.id;
    const totals = await query<{ type: string; total: string }>(
      `SELECT type, COALESCE(SUM(amount), 0)::text AS total FROM transactions
       WHERE user_id=$1 AND deleted_at IS NULL AND "date" >= $2::date AND "date" < $2::date + INTERVAL '1 month'
       GROUP BY type`, [userId, month]
    );
    const byCategory = await query<{ category_id: string; name: string; total: string }>(
      `SELECT t.category_id, COALESCE(c.name, 'Khác') AS name, SUM(t.amount)::text AS total
       FROM transactions t LEFT JOIN categories c ON c.id=t.category_id AND (c.user_id IS NULL OR c.user_id=t.user_id)
       WHERE t.user_id=$1 AND t.type='EXPENSE' AND t.deleted_at IS NULL
         AND t."date" >= $2::date AND t."date" < $2::date + INTERVAL '1 month'
       GROUP BY t.category_id, c.name ORDER BY SUM(t.amount) DESC`, [userId, month]
    );
    const largest = await query<{ title: string; amount: string; category_name: string; date: string }>(
      `SELECT t.title, t.amount::text, COALESCE(c.name, 'Khác') AS category_name, t."date"::text AS date
       FROM transactions t LEFT JOIN categories c ON c.id=t.category_id AND (c.user_id IS NULL OR c.user_id=t.user_id)
       WHERE t.user_id=$1 AND t.type='EXPENSE' AND t.deleted_at IS NULL
         AND t."date" >= $2::date AND t."date" < $2::date + INTERVAL '1 month'
       ORDER BY t.amount DESC LIMIT 1`, [userId, month]
    );
    const budgetAlerts = await query<{ category_id: string; category_name: string; allocated_amount: string; spent_amount: string }>(
      `SELECT b.category_id, COALESCE(c.name, 'Khác') AS category_name, b.allocated_amount::text,
         COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.user_id=b.user_id AND t.category_id=b.category_id
           AND t.type='EXPENSE' AND t.deleted_at IS NULL AND t."date" >= b.month AND t."date" < b.month + INTERVAL '1 month'), 0)::text AS spent_amount
       FROM budgets b LEFT JOIN categories c ON c.id=b.category_id AND (c.user_id IS NULL OR c.user_id=b.user_id)
       WHERE b.user_id=$1 AND b.month=$2::date AND b.deleted_at IS NULL`, [userId, month]
    );

    const income = Number(totals.rows.find((item) => item.type === 'INCOME')?.total || 0);
    const expense = Number(totals.rows.find((item) => item.type === 'EXPENSE')?.total || 0);
    const insights: string[] = [];
    if (expense > 0 && income > 0) insights.push(`Bạn đã chi ${expense.toLocaleString('vi-VN')} đồng, tương đương ${Math.round((expense / income) * 100)}% thu nhập tháng này.`);
    if (largest.rows[0]) insights.push(`Khoản chi lớn nhất là "${largest.rows[0].title}" (${Number(largest.rows[0].amount).toLocaleString('vi-VN')} đồng) thuộc nhóm ${largest.rows[0].category_name}.`);
    for (const budget of budgetAlerts.rows) {
      const allocated = Number(budget.allocated_amount);
      const spent = Number(budget.spent_amount);
      if (allocated > 0 && spent >= allocated) insights.push(`Bạn đã vượt ngân sách nhóm ${budget.category_name}.`);
      else if (allocated > 0 && spent / allocated >= 0.8) insights.push(`Ngân sách nhóm ${budget.category_name} đã dùng ${Math.round((spent / allocated) * 100)}%.`);
    }
    if (insights.length === 0) insights.push('Hãy thêm giao dịch và ngân sách để nhận phân tích chi tiêu cá nhân.');

    res.json({ data: {
      month: month.slice(0, 7),
      income,
      expense,
      balance: income - expense,
      byCategory: byCategory.rows.map((item) => ({ categoryId: item.category_id, categoryName: item.name, amount: Number(item.total) })),
      largestExpense: largest.rows[0] ? { title: largest.rows[0].title, amount: Number(largest.rows[0].amount), categoryName: largest.rows[0].category_name, date: largest.rows[0].date } : null,
      budgetAlerts: budgetAlerts.rows.map((item) => ({ categoryId: item.category_id, categoryName: item.category_name, allocatedAmount: Number(item.allocated_amount), spentAmount: Number(item.spent_amount) })),
      insights,
    } });
  } catch (error) { next(error); }
});

router.get('/health', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const [wallets, totals, debts] = await Promise.all([
      query<{ total: string }>('SELECT COALESCE(SUM(balance), 0)::text AS total FROM wallets WHERE user_id=$1 AND deleted_at IS NULL AND is_excluded_from_total=FALSE', [userId]),
      query<{ type: string; total: string }>(
        `SELECT type, COALESCE(SUM(amount), 0)::text AS total FROM transactions
         WHERE user_id=$1 AND deleted_at IS NULL AND "date" >= date_trunc('month', CURRENT_DATE)
           AND "date" < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' GROUP BY type`, [userId]
      ),
      query<{ pending: string }>("SELECT COALESCE(SUM(CASE WHEN type='BORROWED' THEN amount ELSE -amount END), 0)::text AS pending FROM debts_loans WHERE user_id=$1 AND status='PENDING' AND deleted_at IS NULL", [userId]),
    ]);
    const income = Number(totals.rows.find((row) => row.type === 'INCOME')?.total || 0);
    const expense = Number(totals.rows.find((row) => row.type === 'EXPENSE')?.total || 0);
    const savingsRate = income > 0 ? Math.max(0, Math.min(100, ((income - expense) / income) * 100)) : 0;
    const score = Math.round(Math.max(0, Math.min(1000, 500 + savingsRate * 5 - Math.max(0, expense - income) / 1000)));
    const tier = score >= 800 ? 'Bậc thầy tài chính' : score >= 650 ? 'Vững vàng' : score >= 500 ? 'Khá tốt' : 'Khởi đầu';
    const actionableTips = [
      ...(savingsRate < 20 ? ['Hãy cố gắng nâng tỷ lệ tiết kiệm lên ít nhất 20%.'] : []),
      ...(expense > income ? ['Chi tiêu đang cao hơn thu nhập, nên rà soát các khoản không thiết yếu.'] : []),
      ...(Number(debts.rows[0].pending) > 0 ? ['Theo dõi các khoản nợ phải trả và đặt nhắc hạn thanh toán.'] : []),
    ];
    if (actionableTips.length === 0) actionableTips.push('Tiếp tục duy trì thói quen ghi chép và rà soát ngân sách hàng tháng.');
    res.json({ data: {
      score,
      tier,
      savingsRate: Number(savingsRate.toFixed(2)),
      debtToIncomeRatio: income > 0 ? Number((Math.max(0, Number(debts.rows[0].pending)) / income * 100).toFixed(2)) : 0,
      emergencyFundMonths: expense > 0 ? Number((Number(wallets.rows[0].total) / expense).toFixed(2)) : 0,
      budgetAdherence: income > 0 ? Number((Math.max(0, 1 - expense / income) * 100).toFixed(2)) : 0,
      actionableTips,
    } });
  } catch (error) { next(error); }
});

export default router;
