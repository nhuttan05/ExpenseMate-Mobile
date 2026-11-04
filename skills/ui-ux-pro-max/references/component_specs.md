# TIÊU CHUẨN THIẾT KẾ COMPONENT CAO CẤP (DESIGN COMPONENT SPECIFICATIONS)

Tài liệu này cung cấp các đoạn mã chuẩn Tailwind CSS & React cho từng loại component giao diện, đảm bảo tính đồng bộ, thẩm mỹ và công thái học.

---

## 1. HỆ THỐNG NÚT BẤM (BUTTONS)

### Nút Hành Động Chính (Primary Button):
```tsx
<button
  type="button"
  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#10542C] hover:bg-[#0c3e20] active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-[#10542C]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10542C] focus-visible:ring-offset-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
>
  <CheckCircle2 className="w-4 h-4 text-[#8BC34A]" />
  <span>Xác Nhận Ký Quỹ</span>
</button>
```

### Nút Thứ Cấp (Secondary / Outline Button):
```tsx
<button
  type="button"
  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-emerald-50/50 active:scale-[0.98] text-[#10542C] border border-emerald-200 hover:border-emerald-300 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
>
  <Printer className="w-4 h-4" />
  <span>In Bản Hợp Đồng</span>
</button>
```

### Nút Nguy Hiểm / Hủy Bỏ (Destructive Button):
```tsx
<button
  type="button"
  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 active:scale-[0.98] text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
>
  <Trash2 className="w-4 h-4" />
  <span>Hủy Lô Vụ Mùa</span>
</button>
```

---

## 2. THẺ CHỈ SỐ KPI (METRIC CARD BENTO)
```tsx
<div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-150 hover:border-emerald-200 shadow-2xs hover:shadow-sm transition-all group">
  <div className="flex items-center justify-between mb-2">
    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
      Sản Lượng Net Đạt Chuẩn
    </span>
    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#10542C] flex items-center justify-center group-hover:scale-110 transition-transform">
      <Scale className="w-4 h-4" />
    </div>
  </div>
  <div className="flex items-baseline gap-2">
    <span className="text-2xl font-black text-[#10542C] tracking-tight">
      18,500
    </span>
    <span className="text-xs font-bold text-slate-400">kg</span>
  </div>
  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
    <TrendingUp className="w-3.5 h-3.5" />
    <span>+12.4% so với vụ trước</span>
  </div>
</div>
```

---

## 3. THANH TIẾN TRÌNH VẬN CHUYỂN (STEPPER TIMELINE)
```tsx
<div className="grid grid-cols-4 gap-2 relative">
  {steps.map((step, idx) => {
    const isCompleted = idx <= currentIdx;
    const isCurrent = idx === currentIdx;
    const Icon = step.icon;
    return (
      <div key={step.key} className="flex flex-col items-center text-center">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
            isCurrent
              ? 'bg-[#10542C] text-white ring-4 ring-[#8BC34A]/30 shadow-md scale-105 animate-pulse'
              : isCompleted
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-gray-100 text-gray-400 border border-gray-200'
          }`}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <span
          className={`text-xs mt-2 font-bold leading-tight ${
            isCurrent ? 'text-[#10542C]' : isCompleted ? 'text-slate-800' : 'text-slate-400'
          }`}
        >
          {step.label}
        </span>
        <span className="text-[10px] text-slate-400 leading-tight mt-0.5 hidden sm:block">
          {step.desc}
        </span>
      </div>
    );
  })}
</div>
```

---

## 4. BẢNG DỮ LIỆU CHUYÊN NGHIỆP (MASTER DATA TABLE)
```tsx
<div className="overflow-hidden bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse text-xs">
      <thead>
        <tr className="bg-[#FAFBF9] border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
          <th className="py-3 px-4">Mã Hợp Đồng</th>
          <th className="py-3 px-4">Nông Sản</th>
          <th className="py-3 px-4 text-right">Khối Lượng</th>
          <th className="py-3 px-4 text-center">Độ Ngọt Brix</th>
          <th className="py-3 px-4 text-center">Trạng Thái</th>
          <th className="py-3 px-4 text-right">Thao Tác</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 text-slate-700">
        <tr className="hover:bg-emerald-50/30 transition-colors">
          <td className="py-3.5 px-4 font-mono font-bold text-[#10542C]">HD-2026-0104</td>
          <td className="py-3.5 px-4 font-bold text-slate-900">Cà Chua Beef VietGAP</td>
          <td className="py-3.5 px-4 text-right tabular-nums font-bold">5,000 kg</td>
          <td className="py-3.5 px-4 text-center font-bold text-amber-600">5.8 °Bx</td>
          <td className="py-3.5 px-4 text-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Đang Giao Xe Lạnh
            </span>
          </td>
          <td className="py-3.5 px-4 text-right">
            <button className="px-2.5 py-1 text-xs font-bold text-[#10542C] hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer">
              Chi tiết →
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## 5. HỘP THOẠI POPUP MODAL (MODAL DIALOG)
```tsx
<div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
  {/* Backdrop mờ */}
  <div className="fixed inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />

  {/* Modal Container */}
  <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto border border-gray-100">
    <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
      <h3 className="font-heading text-lg font-black text-[#10542C]">Tiêu Đề Hộp Thoại</h3>
      <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
        ✕
      </button>
    </div>
    <div className="space-y-4">
      {/* Nội dung modal */}
    </div>
  </div>
</div>
```
