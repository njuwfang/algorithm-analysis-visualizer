const MIN_BAR_HEIGHT_PERCENT = 55;
const MAX_BAR_HEIGHT_PERCENT = 100;
const EQUAL_BAR_HEIGHT_PERCENT = (MIN_BAR_HEIGHT_PERCENT + MAX_BAR_HEIGHT_PERCENT) / 2;

export function relativeBarHeights(values) {
  if (values.length === 0) return [];

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);

  if (minimum === maximum) {
    return values.map(() => EQUAL_BAR_HEIGHT_PERCENT);
  }

  // Scale before finding each ratio so inputs near Number.MAX_VALUE do not
  // overflow when the range crosses zero.
  const magnitude = Math.max(Math.abs(minimum), Math.abs(maximum));
  const scaledMinimum = minimum / magnitude;
  const scaledRange = (maximum / magnitude) - scaledMinimum;

  return values.map((value) => {
    const ratio = ((value / magnitude) - scaledMinimum) / scaledRange;
    const boundedRatio = Math.min(1, Math.max(0, ratio));
    return MIN_BAR_HEIGHT_PERCENT
      + boundedRatio * (MAX_BAR_HEIGHT_PERCENT - MIN_BAR_HEIGHT_PERCENT);
  });
}
