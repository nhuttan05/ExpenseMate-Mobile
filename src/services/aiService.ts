import { Category, Transaction } from '../types';
import { categories } from '../data/mockData';

export const AIService = {
  parseNaturalLanguage: (text: string): { title: string; amount: number; category: Category } | null => {
    const normalized = text.toLowerCase().replace(/,/g, '.');
    const amountMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(k|nghìn|ngàn|triệu|tr|đ|đồng)?/i);
    if (!amountMatch || !/(hôm nay|chi|mua|ăn|trả|thanh toán|uống|tiền)/i.test(normalized)) return null;

    const rawAmount = amountMatch[1];
    const amount = rawAmount.includes('.') && rawAmount.split('.').pop()!.length === 3
      ? Number(rawAmount.replace(/\./g, ''))
      : Number(rawAmount);
    let normalizedAmount = amount;
    const unit = amountMatch[2];
    if (unit === 'k' || unit === 'nghìn' || unit === 'ngàn') normalizedAmount *= 1000;
    if (unit === 'triệu' || unit === 'tr') normalizedAmount *= 1000000;
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) return null;

    const title = text
      .replace(amountMatch[0], '')
      .replace(/hôm nay|đồng|vnd/gi, '')
      .replace(/^[\s,:-]+|[\s,:-]+$/g, '')
      .trim() || 'Giao dịch từ AI';
    return { title: title.charAt(0).toUpperCase() + title.slice(1), amount: normalizedAmount, category: AIService.predictCategory(title) };
  },

  /**
   * Basic NLP rule-based category predictor based on transaction title
   */
  predictCategory: (title: string): Category => {
    const lower = title.toLowerCase();

    // Food & Dining
    if (
      lower.includes('ăn') ||
      lower.includes('cơm') ||
      lower.includes('phở') ||
      lower.includes('bún') ||
      lower.includes('winmart') ||
      lower.includes('coopmart') ||
      lower.includes('chợ') ||
      lower.includes('siêu thị') ||
      lower.includes('nhà hàng')
    ) {
      return categories.find((c) => c.id === 'cat_food') || categories[0];
    }

    // Cafe & Drinks
    if (
      lower.includes('cafe') ||
      lower.includes('cà phê') ||
      lower.includes('highlands') ||
      lower.includes('starbucks') ||
      lower.includes('trà') ||
      lower.includes('phúc long')
    ) {
      return categories.find((c) => c.id === 'cat_cafe') || categories[0];
    }

    // Utilities & Bills
    if (
      lower.includes('điện') ||
      lower.includes('nước') ||
      lower.includes('evn') ||
      lower.includes('internet') ||
      lower.includes('wifi') ||
      lower.includes('hóa đơn') ||
      lower.includes('tiền nhà')
    ) {
      return categories.find((c) => c.id === 'cat_utilities') || categories[0];
    }

    // Transport & Gas
    if (
      lower.includes('xăng') ||
      lower.includes('petrolimex') ||
      lower.includes('grab') ||
      lower.includes('be') ||
      lower.includes('xe') ||
      lower.includes('gửi xe') ||
      lower.includes('taxi')
    ) {
      return categories.find((c) => c.id === 'cat_transport') || categories[0];
    }

    // Shopping
    if (
      lower.includes('shopee') ||
      lower.includes('tiki') ||
      lower.includes('lazada') ||
      lower.includes('quần áo') ||
      lower.includes('mua sắm') ||
      lower.includes('giày')
    ) {
      return categories.find((c) => c.id === 'cat_shopping') || categories[0];
    }

    // Income / Salary
    if (
      lower.includes('lương') ||
      lower.includes('thưởng') ||
      lower.includes('thu nhập') ||
      lower.includes('tiền về') ||
      lower.includes('hoa hồng')
    ) {
      return categories.find((c) => c.id === 'cat_salary') || categories[1];
    }

    // Default
    return categories[0];
  },

  /**
   * Financial health analysis & recommendations
   */
  generateInsights: (transactions: Transaction[], monthlyIncome: number, monthlyExpense: number) => {
    const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100) : 0;
    const isExceeding = monthlyExpense > 35000000;

    const insights: string[] = [];

    if (savingsRate >= 30) {
      insights.push(`Xuất sắc! Tỷ lệ tiết kiệm tháng này đạt ${savingsRate}%, vượt mục tiêu tiêu chuẩn 20%.`);
    } else if (savingsRate > 0) {
      insights.push(`Tỷ lệ tiết kiệm tháng này là ${savingsRate}%. Bạn có thể tối ưu thêm ở danh mục Mua sắm & Cafe.`);
    } else {
      insights.push(`Cảnh báo: Chi tiêu đang vượt thu nhập tháng. Hãy rà soát lại các khoản chi không cấp thiết.`);
    }

    if (isExceeding) {
      insights.push('Hạn mức ngân sách tổng thể đã vượt kế hoạch 35.000.000 đ.');
    } else {
      insights.push('Tổng chi tiêu đang trong vùng an toàn (dưới 85% hạn mức tháng).');
    }

    return {
      savingsRate,
      isExceeding,
      insights,
    };
  },
};
