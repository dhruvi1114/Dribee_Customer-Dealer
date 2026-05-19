import type { VolumeSlabPrice } from '@/types/catalogue';

export interface AppliedSlab {
  matched: VolumeSlabPrice | null;
  unitPriceAfterDiscount: number;
  lineTotal: number;
  amountSaved: number;
  discountPct: number;
  nextSlab: VolumeSlabPrice | null;
}

// Picks the highest qualifying slab (by min_qty) and returns the discounted
// line totals. If no slab matches and a higher one exists, returns it as
// `nextSlab` for a nudge message ("Add N more for X% off").
export const applyVolumeSlab = (
  unitPrice: number,
  qty: number,
  slabs: VolumeSlabPrice[] | undefined,
): AppliedSlab => {
  const baseTotal = unitPrice * qty;
  if (!slabs || slabs.length === 0) {
    return {
      matched: null,
      unitPriceAfterDiscount: unitPrice,
      lineTotal: baseTotal,
      amountSaved: 0,
      discountPct: 0,
      nextSlab: null,
    };
  }

  const sorted = [...slabs].sort((a, b) => a.minQty - b.minQty);
  const qualifying = sorted.filter((s) => qty >= s.minQty);
  const matched = qualifying.length > 0 ? qualifying[qualifying.length - 1] : null;
  const nextSlab = sorted.find((s) => s.minQty > qty) ?? null;

  if (!matched) {
    return {
      matched: null,
      unitPriceAfterDiscount: unitPrice,
      lineTotal: baseTotal,
      amountSaved: 0,
      discountPct: 0,
      nextSlab,
    };
  }

  const discountPct = matched.discount ?? 0;
  const unitPriceAfterDiscount =
    discountPct > 0 ? unitPrice * (1 - discountPct / 100) : matched.price ?? unitPrice;
  const lineTotal = unitPriceAfterDiscount * qty;
  const amountSaved = Math.max(0, baseTotal - lineTotal);

  return {
    matched,
    unitPriceAfterDiscount,
    lineTotal,
    amountSaved,
    discountPct,
    nextSlab,
  };
};
