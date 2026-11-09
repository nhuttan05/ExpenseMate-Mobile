import { Category, Transaction, Wallet, JarCode, WhatIfScenario, FinancialHealth } from '../types';
import { categories, initialWallets, initialHealth } from '../data/mockData';

export const AIService = {
  /**
   * Phân tích văn bản tiếng Việt tự nhiên thành giao dịch có đầy đủ Ví, Danh mục, Hũ JARS
   */
  parseNaturalLanguage: (
    text: string,
    availableWallets: Wallet[] = initialWallets
  ): {
    title: string;
    amount: number;
    category: Category;
    walletId: string;
    jarCode: JarCode;
  } | null => {
    const normalized = text.toLowerCase().replace(/,/g, '.');
    const amountMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(k|nghìn|ngàn|triệu|tr|đ|đồng)?/i);
    if (!amountMatch || !/(hôm nay|chi|mua|ăn|trả|thanh toán|uống|tiền|đổ|chuyển|nhận)/i.test(normalized)) {
      return null;
    }

    const rawAmount = amountMatch[1];
    const amount =
      rawAmount.includes('.') && rawAmount.split('.').pop()!.length === 3
        ? Number(rawAmount.replace(/\./g, ''))
        : Number(rawAmount);

    let normalizedAmount = amount;
    const unit = (amountMatch[2] || '').toLowerCase();
    if (unit === 'k' || unit === 'nghìn' || unit === 'ngàn') normalizedAmount *= 1000;
    if (unit === 'triệu' || unit === 'tr') normalizedAmount *= 1000000;
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) return null;

    // Trích xuất ví
    let detectedWalletId = availableWallets[0]?.id || 'wallet_vcb';
    if (normalized.includes('momo') || normalized.includes('ví điện tử')) {
      detectedWalletId = 'wallet_momo';
    } else if (normalized.includes('tiền mặt') || normalized.includes('ví tiền') || normalized.includes('trong túi')) {
      detectedWalletId = 'wallet_cash';
    } else if (normalized.includes('tín dụng') || normalized.includes('vpbank') || normalized.includes('quẹt thẻ')) {
      detectedWalletId = 'wallet_credit';
    } else if (normalized.includes('vcb') || normalized.includes('vietcombank') || normalized.includes('ngân hàng') || normalized.includes('chuyển khoản')) {
      detectedWalletId = 'wallet_vcb';
    }

    // Làm sạch tiêu đề
    const title = text
      .replace(amountMatch[0], '')
      .replace(/hôm nay|đồng|vnd|trừ|ví|momo|vcb|tiền mặt|chuyển khoản|ngân hàng/gi, '')
      .replace(/^[\s,:-]+|[\s,:-]+$/g, '')
      .trim() || 'Giao dịch thông minh';

    const category = AIService.predictCategory(title);
    const jarCode = AIService.predictJarCode(category, title);

    return {
      title: title.charAt(0).toUpperCase() + title.slice(1),
      amount: normalizedAmount,
      category,
      walletId: detectedWalletId,
      jarCode,
    };
  },

  /**
   * Dự đoán Danh mục dựa trên NLP tiếng Việt
   */
  predictCategory: (title: string): Category => {
    const lower = title.toLowerCase();

    // Ăn uống
    if (
      lower.includes('ăn') ||
      lower.includes('cơm') ||
      lower.includes('phở') ||
      lower.includes('bún') ||
      lower.includes('winmart') ||
      lower.includes('coopmart') ||
      lower.includes('chợ') ||
      lower.includes('siêu thị') ||
      lower.includes('bánh mì') ||
      lower.includes('lẩu')
    ) {
      return categories.find((c) => c.id === 'cat_food') || categories[0];
    }

    // Cafe & Đồ uống
    if (
      lower.includes('cafe') ||
      lower.includes('cà phê') ||
      lower.includes('highlands') ||
      lower.includes('starbucks') ||
      lower.includes('trà sữa') ||
      lower.includes('phúc long') ||
      lower.includes('toco')
    ) {
      return categories.find((c) => c.id === 'cat_cafe') || categories[0];
    }

    // Tiện ích & Hóa đơn
    if (
      lower.includes('điện') ||
      lower.includes('nước') ||
      lower.includes('internet') ||
      lower.includes('wifi') ||
      lower.includes('tiền nhà') ||
      lower.includes('tiền trọ') ||
      lower.includes('phí chung cư')
    ) {
      return categories.find((c) => c.id === 'cat_utilities') || categories[0];
    }

    // Di chuyển & Xăng xe
    if (
      lower.includes('xăng') ||
      lower.includes('petrolimex') ||
      lower.includes('grab') ||
      lower.includes('be') ||
      lower.includes('xe ôm') ||
      lower.includes('gửi xe') ||
      lower.includes('vé xe')
    ) {
      return categories.find((c) => c.id === 'cat_transport') || categories[0];
    }

    // Học tập & Sách vở
    if (
      lower.includes('sách') ||
      lower.includes('học') ||
      lower.includes('khóa học') ||
      lower.includes('fahasa') ||
      lower.includes('học phí')
    ) {
      return categories.find((c) => c.id === 'cat_education') || categories[0];
    }

    // Đầu tư & Sinh lời
    if (
      lower.includes('cổ phiếu') ||
      lower.includes('chứng khoán') ||
      lower.includes('vàng') ||
      lower.includes('lãi suất') ||
      lower.includes('cổ tức')
    ) {
      return categories.find((c) => c.id === 'cat_investment') || categories[0];
    }

    // Lương
    if (lower.includes('lương') || lower.includes('thưởng') || lower.includes('hoa hồng')) {
      return categories.find((c) => c.id === 'cat_salary') || categories[0];
    }

    return categories.find((c) => c.id === 'cat_shopping') || categories[0];
  },

  /**
   * Gợi ý Hũ JARS tương ứng
   */
  predictJarCode: (category: Category, title: string): JarCode => {
    if (category.jarCode) return category.jarCode;
    const lower = title.toLowerCase();
    if (lower.includes('tiết kiệm') || lower.includes('laptop') || lower.includes('xe') || lower.includes('du lịch')) {
      return 'LTSS';
    }
    if (lower.includes('biếu') || lower.includes('từ thiện') || lower.includes('mừng cưới')) {
      return 'GIVE';
    }
    if (category.id === 'cat_cafe' || category.id === 'cat_shopping') return 'PLAY';
    if (category.id === 'cat_education') return 'EDU';
    if (category.id === 'cat_investment') return 'FFA';
    return 'NEC';
  },

  /**
   * Mô phỏng tài chính Cỗ máy tương lai (What-If Simulator)
   */
  simulateWhatIfScenario: (
    title: string,
    targetAmount: number,
    durationMonths: number = 1,
    monthlyIncome: number = 35000000,
    monthlyExpense: number = 18200000,
    totalBalance: number = 125800000
  ): WhatIfScenario => {
    const monthlySurplus = Math.max(0, monthlyIncome - monthlyExpense);
    const monthlyPayment = durationMonths > 1 ? Math.round(targetAmount / durationMonths) : targetAmount;
    const impactRate = (monthlyPayment / monthlyIncome) * 100;

    let feasibilityScore = 95;
    let safeToBuy = true;
    let impactAssessment = '';
    let recommendation = '';

    if (durationMonths === 1) {
      const balanceRatio = (targetAmount / totalBalance) * 100;
      if (balanceRatio > 60) {
        feasibilityScore = 45;
        safeToBuy = false;
        impactAssessment = `Khoản chi này ngốn đến ${balanceRatio.toFixed(1)}% tổng tài sản của bạn, gây rủi ro đứt gãy dòng tiền khẩn cấp.`;
        recommendation = `Chưa nên mua ngay. Khuyến nghị chia nhỏ thành trả góp hoặc tích lũy thêm tối thiểu 3 tháng.`;
      } else if (balanceRatio > 30) {
        feasibilityScore = 72;
        safeToBuy = true;
        impactAssessment = `Khoản chi chiếm ${balanceRatio.toFixed(1)}% tổng tài sản khả dụng. Không ảnh hưởng quỹ dự phòng nhưng sẽ giảm nhẹ thanh khoản.`;
        recommendation = `Khả thi. Bạn có thể chi trả và nên hạn chế mua sắm phát sinh trong tháng tới.`;
      } else {
        feasibilityScore = 94;
        safeToBuy = true;
        impactAssessment = `Khoản chi chỉ chiếm ${balanceRatio.toFixed(1)}% tài sản, hoàn toàn nằm trong vùng an toàn tuyệt đối.`;
        recommendation = `Rất an toàn để quyết định ngay! Không gây bất kỳ ảnh hưởng nào tới kế hoạch tài chính dài hạn.`;
      }
    } else {
      if (monthlyPayment > monthlySurplus) {
        feasibilityScore = 40;
        safeToBuy = false;
        impactAssessment = `Khoản trả góp (${monthlyPayment.toLocaleString('vi-VN')} đ/tháng) vượt quá thặng dư tiết kiệm hàng tháng (${monthlySurplus.toLocaleString('vi-VN')} đ).`;
        recommendation = `Báo động thâm hụt! Nếu mua bạn sẽ phải rút lõm vào tiền tiết kiệm dự phòng mỗi tháng.`;
      } else if (impactRate > 20) {
        feasibilityScore = 68;
        safeToBuy = true;
        impactAssessment = `Mỗi tháng bạn sẽ phải trích ${impactRate.toFixed(1)}% tổng thu nhập liên tục trong ${durationMonths} tháng.`;
        recommendation = `Cần cân nhắc kỹ. Bạn nên cắt giảm 30% ngân sách Hũ Hưởng thụ & Giải trí để bù đắp khoản trả góp này.`;
      } else {
        feasibilityScore = 88;
        safeToBuy = true;
        impactAssessment = `Chỉ chiếm ${impactRate.toFixed(1)}% thu nhập mỗi tháng, bạn vẫn dư dả tiền tiết kiệm và đầu tư.`;
        recommendation = `Quyết định trả góp an toàn và thông minh, giúp bạn giữ được dòng tiền tươi trong tài khoản sinh lời.`;
      }
    }

    return {
      id: `whatif_${Date.now()}`,
      title,
      targetAmount,
      monthlyPayment: durationMonths > 1 ? monthlyPayment : undefined,
      durationMonths: durationMonths > 1 ? durationMonths : undefined,
      category: 'Kế hoạch tài chính giả định',
      impactAssessment,
      recommendation,
      feasibilityScore,
      safeToBuy,
    };
  },

  /**
   * Tính toán Điểm Sức Khỏe Tài Chính toàn diện (0 - 1000)
   */
  evaluateFinancialHealth: (
    wallets: Wallet[] = initialWallets,
    monthlyIncome: number = 35000000,
    monthlyExpense: number = 18200000
  ): FinancialHealth => {
    const totalLiquidAssets = wallets
      .filter((w) => w.type !== 'CREDIT' && !w.isExcludedFromTotal)
      .reduce((sum, w) => sum + w.balance, 0);

    const creditDebt = wallets
      .filter((w) => w.type === 'CREDIT')
      .reduce((sum, w) => sum + Math.abs(w.balance), 0);

    const savingsRate = Math.max(0, ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100);
    const debtRatio = (creditDebt / monthlyIncome) * 100;
    const emergencyMonths = monthlyExpense > 0 ? totalLiquidAssets / monthlyExpense : 6;
    const budgetAdherence = 85.0;

    let score = 400; // base score
    // 1. Savings rate (+0 to 200)
    score += Math.min(200, Math.round(savingsRate * 4));
    // 2. Emergency fund (+0 to 250)
    score += Math.min(250, Math.round(emergencyMonths * 50));
    // 3. Low debt ratio (+0 to 150)
    score += Math.max(0, Math.round(150 - debtRatio * 3));

    score = Math.min(1000, Math.max(200, score));

    let tier: FinancialHealth['tier'] = 'Khởi đầu';
    if (score >= 800) tier = 'Bậc thầy tài chính';
    else if (score >= 700) tier = 'Vững vàng';
    else if (score >= 550) tier = 'Khá tốt';

    return {
      score,
      tier,
      savingsRate: Number(savingsRate.toFixed(1)),
      debtToIncomeRatio: Number(debtRatio.toFixed(1)),
      emergencyFundMonths: Number(emergencyMonths.toFixed(1)),
      budgetAdherence,
      actionableTips: [
        `Quỹ khẩn cấp hiện tại bảo vệ bạn an toàn trong ${emergencyMonths.toFixed(1)} tháng tới mà không cần lo lắng gián đoạn công việc.`,
        debtRatio > 15
          ? `Dư nợ tín dụng đang chiếm ${debtRatio.toFixed(1)}% thu nhập, hãy ưu tiên tất toán đúng hạn để tránh lãi suất cao.`
          : `Tỷ lệ nợ chỉ ${debtRatio.toFixed(1)}% thu nhập, đòn bẩy tài chính đang được bạn kiểm soát rất tốt.`,
        `Tỷ lệ tiết kiệm tháng này đạt ${savingsRate.toFixed(1)}%, hãy tiếp tục phân bổ đều đặn vào Hũ Tự do tài chính & Đầu tư.`,
      ],
    };
  },

  /**
   * Tạo insight chi tiêu tổng quan cho AI Chatbot
   */
  generateInsights: (
    transactions: Transaction[],
    monthlyIncome: number,
    monthlyExpense: number
  ): { savingsRate: number; insights: string[] } => {
    const savingsRate = monthlyIncome > 0
      ? Number((((monthlyIncome - monthlyExpense) / monthlyIncome) * 100).toFixed(1))
      : 0;

    const insights = [
      savingsRate >= 20
        ? `Tỷ lệ tiết kiệm đạt ${savingsRate}%, đạt chuẩn nguyên tắc 50/30/20.`
        : `Tỷ lệ tiết kiệm là ${savingsRate}%, bạn nên cắt giảm bớt chi tiêu giải trí để đưa về mức tối thiểu 20%.`,
      'Khoản chi lớn nhất tháng tập trung vào Tiện ích và Ăn uống sinh hoạt gia đình.',
      'Dòng tiền dương ổn định, không có dấu hiệu thâm hụt tài khoản thanh toán.',
    ];

    return { savingsRate, insights };
  },
};
