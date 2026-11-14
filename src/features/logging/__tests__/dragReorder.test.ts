import { dragFrame } from '../dragReorder';

const layout = { top: 16, gap: 12 };
// Tops: a 16, b 116, c 196 (heights 88, 68, 100).
const heights = { a: 88, b: 68, c: 100 };
const order = ['a', 'b', 'c'];

describe('dragFrame', () => {
  it('keeps the order while the card stays near its slot', () => {
    const frame = dragFrame(order, heights, 'b', 120, layout);
    expect(frame.order).toEqual(order);
    expect(frame.translate).toBe(4);
    expect(frame.shifts).toEqual({ a: 0, c: 0 });
  });

  it('moves a card down past a neighbour once its centre passes the neighbour’s', () => {
    // b's centre at 230 + 34 = 264 is past c's centre (246).
    const frame = dragFrame(order, heights, 'b', 230, layout);
    expect(frame.order).toEqual(['a', 'c', 'b']);
    expect(frame.shifts).toEqual({ a: 0, c: -80 });
    expect(frame.translate).toBe(114);
  });

  it('moves a card up to the top', () => {
    const frame = dragFrame(order, heights, 'c', 0, layout);
    expect(frame.order).toEqual(['c', 'a', 'b']);
    expect(frame.shifts).toEqual({ a: 112, b: 112 });
    expect(frame.translate).toBe(-196);
  });
});
