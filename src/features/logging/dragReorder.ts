/**
 * Layout math for dragging a card through a vertical list. Pure, so it is unit tested.
 *
 * The list keeps its order while a card is dragged: the dragged card follows the finger
 * and the cards it passes slide out of its way. The new order is saved on release.
 */
export interface ListLayout {
  /** Space above the first card. */
  top: number;
  /** Space between cards. */
  gap: number;
}

export interface DragFrame {
  /** The order if the card were dropped now. */
  order: string[];
  /** How far the dragged card is drawn from its own slot. */
  translate: number;
  /** How far each other card slides to make room (0, or the dragged card's height plus a gap). */
  shifts: Record<string, number>;
}

export function dragFrame(
  order: readonly string[],
  heights: Readonly<Record<string, number>>,
  dragId: string,
  /** Where the top of the dragged card should be drawn. */
  desiredTop: number,
  layout: ListLayout,
): DragFrame {
  const tops: Record<string, number> = {};
  let y = layout.top;
  for (const id of order) {
    tops[id] = y;
    y += (heights[id] ?? 0) + layout.gap;
  }
  const height = heights[dragId] ?? 0;
  const center = desiredTop + height / 2;
  const others = order.filter((id) => id !== dragId);
  const target = others.filter((id) => tops[id]! + (heights[id] ?? 0) / 2 < center).length;
  const next = [...others.slice(0, target), dragId, ...others.slice(target)];

  const shifts: Record<string, number> = {};
  for (const id of others) {
    const moved = next.indexOf(id) - order.indexOf(id);
    shifts[id] = Math.sign(moved) * (height + layout.gap);
  }
  return { order: next, translate: desiredTop - (tops[dragId] ?? layout.top), shifts };
}
