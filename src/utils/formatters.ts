/**
 * Format currency number to Vietnamese Dong format (e.g. 124.500.000 đ)
 */
export const formatCurrency = (amount: number, showSymbol = true): string => {
  const formatted = Math.abs(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return showSymbol ? `${formatted} đ` : formatted;
};

/**
 * Format date string to Vietnamese friendly display (e.g. "Hôm nay, 14:30" or "24/10/2026")
 */
export const formatDate = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

/**
 * Định nghĩa 6 Hũ Chi Tiêu (Quy tắc 6 chiếc lọ T. Harv Eker) bằng tiếng Việt 100%
 */
export const JAR_DEFINITIONS: Record<
  string,
  { name: string; shortName: string; percent: number; description: string }
> = {
  NEC: {
    name: 'Nhu cầu thiết yếu',
    shortName: 'Thiết yếu',
    percent: 55,
    description: 'Tiền thuê nhà, ăn uống, hóa đơn điện nước, xăng xe sinh hoạt',
  },
  FFA: {
    name: 'Tự do tài chính & Đầu tư',
    shortName: 'Đầu tư & Tự do',
    percent: 10,
    description: 'Quỹ mua chứng khoán, vàng tích sản, quỹ hưu trí sinh lời',
  },
  LTSS: {
    name: 'Tiết kiệm mua sắm dài hạn',
    shortName: 'Tích lũy dài hạn',
    percent: 10,
    description: 'Quỹ đổi xe máy điện, mua laptop, quỹ dự phòng khẩn cấp',
  },
  EDU: {
    name: 'Học vấn & Phát triển bản thân',
    shortName: 'Học vấn & Kỹ năng',
    percent: 10,
    description: 'Sách chuyên môn, khóa học ngoại ngữ, hội thảo nâng cao tay nghề',
  },
  PLAY: {
    name: 'Hưởng thụ & Giải trí',
    shortName: 'Hưởng thụ & Ăn chơi',
    percent: 10,
    description: 'Cafe gặp gỡ cuối tuần, xem phim rạp, mua sắm giải trí',
  },
  GIVE: {
    name: 'Cho đi & Hiếu hỉ',
    shortName: 'Cho đi & Hiếu nghĩa',
    percent: 5,
    description: 'Biếu bố mẹ, tiền mừng cưới bạn bè, đóng góp cộng đồng',
  },
};

export const getJarName = (code?: string): string => {
  if (!code) return '';
  return JAR_DEFINITIONS[code]?.name || code;
};

export const getJarShortName = (code?: string): string => {
  if (!code) return '';
  return JAR_DEFINITIONS[code]?.shortName || code;
};
