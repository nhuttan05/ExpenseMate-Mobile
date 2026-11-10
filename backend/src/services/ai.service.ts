import { query } from '../db';

export interface AiCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  backgroundColor: string;
  type: 'INCOME' | 'EXPENSE';
}

export interface ParsedTransaction {
  title: string;
  amount: number;
  type: 'EXPENSE';
  category: AiCategory;
  walletId?: string;
  walletName?: string;
  jarCode: 'NEC' | 'FFA' | 'EDU' | 'LTSS' | 'PLAY' | 'GIVE';
}

export interface MonthlyAiInsights {
  month: string;
  income: number;
  expense: number;
  balance: number;
  savingsRate: number;
  largestExpense: {
    title: string;
    amount: number;
    categoryName: string;
    date: string;
  } | null;
  byCategory: Array<{ categoryId: string | null; categoryName: string; amount: number; percentage: number }>;
  budgetAlerts: Array<{
    categoryId: string;
    categoryName: string;
    allocatedAmount: number;
    spentAmount: number;
    percentage: number;
    exceeded: boolean;
  }>;
  insights: string[];
  recommendations: string[];
}

const normalize = (value: string) => value.toLowerCase().replace(/,/g, '.').trim();

const parseAmount = (text: string): { amount: number; raw: string; unit: string } | null => {
  const match = text.match(/(\d+(?:[.]\d+)?)[ ]*(k|nghìn|ngàn|triệu|tr|đ|đồng)?/i);
  if (!match) return null;
  const rawAmount = match[1];
  const hasThousandsSeparator = rawAmount.includes('.') && rawAmount.split('.').pop()!.length === 3;
  let amount = hasThousandsSeparator ? Number(rawAmount.replace(/\./g, '')) : Number(rawAmount);
  const unit = (match[2] || '').toLowerCase();
  if (unit === 'k' || unit === 'nghìn' || unit === 'ngàn') amount *= 1000;
  if (unit === 'triệu' || unit === 'tr') amount *= 1_000_000;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { amount, raw: match[0], unit };
};

const categoryKeywords: Array<{ id: string; keywords: string[]; jarCode: ParsedTransaction['jarCode'] }> = [
  { id: 'cat_food', keywords: ['ăn', 'cơm', 'phở', 'bún', 'lẩu', 'winmart', 'coopmart', 'chợ', 'siêu thị', 'bánh mì'], jarCode: 'NEC' },
  { id: 'cat_cafe', keywords: ['cafe', 'cà phê', 'highlands', 'starbucks', 'trà sữa', 'phúc long', 'toco'], jarCode: 'PLAY' },
  { id: 'cat_bills', keywords: ['điện', 'nước', 'internet', 'wifi', 'tiền nhà', 'tiền trọ', 'phí chung cư'], jarCode: 'NEC' },
  { id: 'cat_transport', keywords: ['xăng', 'petrolimex', 'grab', 'be', 'xe ôm', 'gửi xe', 'vé xe'], jarCode: 'NEC' },
  { id: 'cat_education', keywords: ['sách', 'học', 'khóa học', 'fahasa', 'học phí'], jarCode: 'EDU' },
  { id: 'cat_investment', keywords: ['cổ phiếu', 'chứng khoán', 'vàng', 'lãi suất', 'cổ tức'], jarCode: 'FFA' },
  { id: 'cat_give', keywords: ['biếu', 'từ thiện', 'mừng cưới', 'quyên góp'], jarCode: 'GIVE' },
];

const findCategoryRule = (title: string) => {
  const lower = title.toLowerCase();
  return categoryKeywords.find((rule) => rule.keywords.some((keyword) => lower.includes(keyword)))
    || { id: 'cat_shopping', keywords: [], jarCode: 'PLAY' as const };
};

const loadCategory = async (userId: string, categoryId: string): Promise<AiCategory> => {
  const result = await query<any>(
    `SELECT id, name, icon, color, background_color, type FROM categories
     WHERE id=$1 AND deleted_at IS NULL AND (user_id IS NULL OR user_id=$2)
     ORDER BY user_id NULLS LAST LIMIT 1`,
    [categoryId, userId]
  );
  const row = result.rows[0];
  return {
    id: row?.id || categoryId,
    name: row?.name || 'Mua sắm',
    icon: row?.icon || 'shopping-bag',
    color: row?.color || '#A855F7',
    backgroundColor: row?.background_color || '#F3E8FF',
    type: row?.type || 'EXPENSE',
  };
};

const detectWallet = async (userId: string, text: string) => {
  const result = await query<{ id: string; name: string; type: string }>(
    'SELECT id, name, type FROM wallets WHERE user_id=$1 AND deleted_at IS NULL ORDER BY created_at ASC',
    [userId]
  );
  const lower = text.toLowerCase();
  const preferred = result.rows.find((wallet) => {
    const name = wallet.name.toLowerCase();
    if (lower.includes('momo') || lower.includes('ví điện tử')) return wallet.type === 'E_WALLET' || name.includes('momo');
    if (lower.includes('tiền mặt') || lower.includes('ví tiền') || lower.includes('trong túi')) return wallet.type === 'CASH' || name.includes('tiền mặt');
    if (lower.includes('tín dụng') || lower.includes('vpbank') || lower.includes('quẹt thẻ')) return wallet.type === 'CREDIT' || name.includes('vpbank');
    if (lower.includes('vcb') || lower.includes('vietcombank') || lower.includes('ngân hàng') || lower.includes('chuyển khoản')) return wallet.type === 'BANK' || name.includes('vietcombank') || name.includes('vcb');
    return false;
  });
  return preferred || result.rows[0];
};

export const parseNaturalLanguageTransaction = async (userId: string, text: string): Promise<ParsedTransaction | null> => {
  const normalized = normalize(text);
  const amount = parseAmount(normalized);
  if (!amount || !/(hôm nay|chi|mua|ăn|trả|thanh toán|uống|tiền|đổ|chuyển|nhận)/i.test(normalized)) return null;

  let title = text
    .replace(/\d+(?:[.,]\d+)?\s*(?:k|nghìn|ngàn|triệu|tr|đ|đồng)?/i, '')
    .replace(/hôm nay|đồng|vnd|trừ|ví|momo|vcb|tiền mặt|chuyển khoản|ngân hàng/gi, '')
    .replace(/^[\s,:-]+|[\s,:-]+$/g, '')
    .trim() || 'Giao dịch thông minh';
  title = title.charAt(0).toUpperCase() + title.slice(1);

  const rule = findCategoryRule(title);
  const [category, wallet] = await Promise.all([loadCategory(userId, rule.id), detectWallet(userId, normalized)]);
  return {
    title,
    amount: amount.amount,
    type: 'EXPENSE',
    category,
    walletId: wallet?.id,
    walletName: wallet?.name,
    jarCode: rule.jarCode,
  };
};

const monthStart = (month?: string) => {
  const value = month || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) throw new Error('INVALID_MONTH');
  return { value, date: `${value}-01` };
};

export const getMonthlyAiInsights = async (userId: string, requestedMonth?: string): Promise<MonthlyAiInsights> => {
  const { value: month, date } = monthStart(requestedMonth);
  const [totals, byCategory, largest, budgets] = await Promise.all([
    query<{ type: string; total: string }>(
      `SELECT type, COALESCE(SUM(amount), 0)::text AS total FROM transactions
       WHERE user_id=$1 AND deleted_at IS NULL AND "date" >= $2::date AND "date" < $2::date + INTERVAL '1 month'
       GROUP BY type`, [userId, date]
    ),
    query<{ category_id: string | null; name: string; total: string }>(
      `SELECT t.category_id, COALESCE(c.name, 'Khác') AS name, SUM(t.amount)::text AS total
       FROM transactions t LEFT JOIN categories c ON c.id=t.category_id AND (c.user_id IS NULL OR c.user_id=t.user_id)
       WHERE t.user_id=$1 AND t.type='EXPENSE' AND t.deleted_at IS NULL
         AND t."date" >= $2::date AND t."date" < $2::date + INTERVAL '1 month'
       GROUP BY t.category_id, c.name ORDER BY SUM(t.amount) DESC`, [userId, date]
    ),
    query<{ title: string; amount: string; category_name: string; date: string }>(
      `SELECT t.title, t.amount::text, COALESCE(c.name, 'Khác') AS category_name, t."date"::text AS date
       FROM transactions t LEFT JOIN categories c ON c.id=t.category_id AND (c.user_id IS NULL OR c.user_id=t.user_id)
       WHERE t.user_id=$1 AND t.type='EXPENSE' AND t.deleted_at IS NULL
         AND t."date" >= $2::date AND t."date" < $2::date + INTERVAL '1 month'
       ORDER BY t.amount DESC LIMIT 1`, [userId, date]
    ),
    query<{ category_id: string; category_name: string; allocated_amount: string; spent_amount: string }>(
      `SELECT b.category_id, COALESCE(c.name, 'Khác') AS category_name, b.allocated_amount::text,
         COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.user_id=b.user_id AND t.category_id=b.category_id
           AND t.type='EXPENSE' AND t.deleted_at IS NULL AND t."date" >= b.month AND t."date" < b.month + INTERVAL '1 month'), 0)::text AS spent_amount
       FROM budgets b LEFT JOIN categories c ON c.id=b.category_id AND (c.user_id IS NULL OR c.user_id=b.user_id)
       WHERE b.user_id=$1 AND b.month=$2::date AND b.deleted_at IS NULL`, [userId, date]
    ),
  ]);

  const income = Number(totals.rows.find((item) => item.type === 'INCOME')?.total || 0);
  const expense = Number(totals.rows.find((item) => item.type === 'EXPENSE')?.total || 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? Number(((balance / income) * 100).toFixed(1)) : 0;
  const totalCategoryExpense = byCategory.rows.reduce((sum, item) => sum + Number(item.total), 0);
  const categoryData = byCategory.rows.map((item) => ({
    categoryId: item.category_id,
    categoryName: item.name,
    amount: Number(item.total),
    percentage: totalCategoryExpense > 0 ? Number((Number(item.total) / totalCategoryExpense * 100).toFixed(1)) : 0,
  }));
  const budgetAlerts = budgets.rows.map((item) => {
    const allocatedAmount = Number(item.allocated_amount);
    const spentAmount = Number(item.spent_amount);
    return {
      categoryId: item.category_id,
      categoryName: item.category_name,
      allocatedAmount,
      spentAmount,
      percentage: allocatedAmount > 0 ? Number((spentAmount / allocatedAmount * 100).toFixed(1)) : 0,
      exceeded: allocatedAmount > 0 && spentAmount >= allocatedAmount,
    };
  });
  const insights: string[] = [];
  const recommendations: string[] = [];
  if (expense > 0 && income > 0) insights.push(`Bạn đã chi ${expense.toLocaleString('vi-VN')} đồng, tương đương ${Math.round(expense / income * 100)}% thu nhập tháng này.`);
  if (largest.rows[0]) insights.push(`Khoản chi lớn nhất là "${largest.rows[0].title}" (${Number(largest.rows[0].amount).toLocaleString('vi-VN')} đồng) thuộc nhóm ${largest.rows[0].category_name}.`);
  for (const budget of budgetAlerts) {
    if (budget.exceeded) insights.push(`Bạn đã vượt ngân sách nhóm ${budget.categoryName} (${budget.percentage}%).`);
    else if (budget.percentage >= 80) insights.push(`Ngân sách nhóm ${budget.categoryName} đã dùng ${budget.percentage}%.`);
  }
  if (savingsRate < 20) recommendations.push('Nên đưa tỷ lệ tiết kiệm lên ít nhất 20% bằng cách giảm các khoản chi linh hoạt.');
  const largestCategory = categoryData[0];
  if (largestCategory && largestCategory.percentage >= 35) recommendations.push(`Nhóm ${largestCategory.categoryName} đang chiếm ${largestCategory.percentage}% tổng chi; hãy đặt giới hạn cho nhóm này trong tháng tới.`);
  if (balance > 0) recommendations.push(`Bạn có thể dành khoảng ${Math.round(balance * 0.2).toLocaleString('vi-VN')} đồng từ phần dư để tăng quỹ dự phòng hoặc tiết kiệm.`);
  if (insights.length === 0) insights.push('Hãy thêm giao dịch và ngân sách để nhận phân tích chi tiêu cá nhân.');
  if (recommendations.length === 0) recommendations.push('Tiếp tục duy trì việc ghi chép giao dịch và rà soát ngân sách mỗi tuần.');

  return {
    month,
    income,
    expense,
    balance,
    savingsRate,
    largestExpense: largest.rows[0] ? {
      title: largest.rows[0].title,
      amount: Number(largest.rows[0].amount),
      categoryName: largest.rows[0].category_name,
      date: largest.rows[0].date,
    } : null,
    byCategory: categoryData,
    budgetAlerts,
    insights,
    recommendations,
  };
};

export const answerAiQuestion = async (userId: string, text: string) => {
  const parsedTransaction = await parseNaturalLanguageTransaction(userId, text);
  if (parsedTransaction) {
    return {
      intent: 'CREATE_TRANSACTION' as const,
      reply: `Đã tạo khoản chi ${parsedTransaction.title} trị giá ${parsedTransaction.amount.toLocaleString('vi-VN')} đồng trong danh mục ${parsedTransaction.category.name}.`,
      parsedTransaction,
      suggestions: ['Phân tích chi tiêu tháng này', 'Làm sao để tiết kiệm 5 triệu?'],
    };
  }

  const normalized = text.toLowerCase();
  const insights = await getMonthlyAiInsights(userId);
  if (normalized.includes('phân tích') || normalized.includes('chi tiêu') || normalized.includes('ngân sách') || normalized.includes('tiết kiệm')) {
    return {
      intent: 'FINANCIAL_INSIGHTS' as const,
      reply: `Phân tích tháng ${insights.month}:\n• Tổng thu: ${insights.income.toLocaleString('vi-VN')} đồng\n• Tổng chi: ${insights.expense.toLocaleString('vi-VN')} đồng\n• Số dư: ${insights.balance.toLocaleString('vi-VN')} đồng\n• Tỷ lệ tiết kiệm: ${insights.savingsRate}%\n\nĐánh giá:\n${insights.insights.map((item) => `✓ ${item}`).join('\n')}\n\nGợi ý:\n${insights.recommendations.map((item) => `• ${item}`).join('\n')}`,
      insights,
      suggestions: ['Ghi thêm một giao dịch', 'Mô phỏng kế hoạch mua sắm'],
    };
  }

  return {
    intent: 'GENERAL' as const,
    reply: 'Tôi có thể phân tích chi tiêu tháng này, nhận diện câu nhập giao dịch hoặc gợi ý kế hoạch tiết kiệm. Ví dụ: “Hôm nay ăn trưa 50k trừ ví momo”.',
    suggestions: ['Phân tích chi tiêu tháng này', 'Làm sao để tiết kiệm 5 triệu?'],
  };
};
