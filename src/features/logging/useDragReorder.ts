import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import {
  Animated,
  PanResponder,
  type HostInstance,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type PanResponderInstance,
  type ScrollViewInstance,
} from 'react-native';

import { dragFrame, type ListLayout } from './dragReorder';

/** How close to the top or bottom edge (px) the finger must be to scroll the list. */
const EDGE = 72;
/** Pixels scrolled per frame near an edge. */
const SCROLL_STEP = 8;

interface Callbacks {
  /** The card was dropped somewhere new; `order` lists every id, first to last. */
  onDrop(order: string[]): void;
  /** Dragging stopped, moved or not. */
  onEnd(): void;
}

interface Drag {
  id: string;
  order: string[];
  target: string[];
  /** The finger, in page coordinates. */
  pageY: number;
  /** Top of the list's viewport in page coordinates, once measured. */
  viewTop: number | null;
  /** True once the list took over the touch from the card. */
  granted: boolean;
}

/**
 * Long-press a card, then drag it. Built on React Native's own PanResponder and Animated,
 * so it needs no native module and ships as an over-the-air update.
 */
class DragController {
  drag: Drag | null = null;
  heights: Record<string, number> = {};
  scroll = { offset: 0, viewport: 0, content: 0 };
  dragY = new Animated.Value(0);
  private shifts = new Map<string, Animated.Value>();
  private shiftTargets = new Map<string, number>();
  callbacks: Callbacks = { onDrop: () => undefined, onEnd: () => undefined };
  panHandlers: PanResponderInstance['panHandlers'];

  constructor(
    private setDragId: (id: string | null) => void,
    private setDropped: (order: { from: string; to: string[] }) => void,
    private layout: ListLayout,
    private scrollRef: RefObject<ScrollViewInstance | null>,
    private containerRef: RefObject<HostInstance | null>,
  ) {
    const follow = (pageY: number, grant = false) => {
      if (!this.drag) return;
      this.drag.pageY = pageY;
      if (grant) this.drag.granted = true;
      this.update();
    };
    this.panHandlers = PanResponder.create({
      onMoveShouldSetPanResponderCapture: () => this.drag !== null,
      onMoveShouldSetPanResponder: () => this.drag !== null,
      onPanResponderGrant: (e) => follow(e.nativeEvent.pageY, true),
      onPanResponderMove: (e) => follow(e.nativeEvent.pageY),
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: () => this.drop(),
      onPanResponderTerminate: () => this.drop(),
    }).panHandlers;
  }

  shift(id: string): Animated.Value {
    let value = this.shifts.get(id);
    if (!value) {
      value = new Animated.Value(0);
      this.shifts.set(id, value);
    }
    return value;
  }

  start(id: string, order: readonly string[], pageY: number) {
    this.drag = { id, order: [...order], target: [...order], pageY, viewTop: null, granted: false };
    this.resetAnimations();
    this.setDragId(id);
    this.containerRef.current?.measure((_x, _y, _w, _h, _pageX, top) => {
      if (!this.drag) return;
      this.drag.viewTop = top;
      this.update();
    });
  }

  /** The card's own press ended. If the list never took the touch over, the drag is over. */
  pressOut() {
    setTimeout(() => {
      if (this.drag && !this.drag.granted) this.drop();
    }, 0);
  }

  update() {
    const drag = this.drag;
    if (!drag || drag.viewTop === null) return;
    const height = this.heights[drag.id] ?? 0;
    const fingerY = drag.pageY - drag.viewTop + this.scroll.offset;
    const frame = dragFrame(drag.order, this.heights, drag.id, fingerY - height / 2, this.layout);
    drag.target = frame.order;
    this.dragY.setValue(frame.translate);
    for (const [id, to] of Object.entries(frame.shifts)) {
      if (this.shiftTargets.get(id) === to) continue;
      this.shiftTargets.set(id, to);
      Animated.timing(this.shift(id), {
        toValue: to,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  }

  /** Called every frame while dragging: scrolls when the finger is near an edge. */
  autoScroll() {
    const drag = this.drag;
    if (!drag || drag.viewTop === null) return;
    const { offset, viewport, content } = this.scroll;
    const y = drag.pageY - drag.viewTop;
    const step = y < EDGE ? -SCROLL_STEP : y > viewport - EDGE ? SCROLL_STEP : 0;
    const next = Math.min(Math.max(0, content - viewport), Math.max(0, offset + step));
    if (next === offset) return;
    this.scroll.offset = next;
    this.scrollRef.current?.scrollTo({ y: next, animated: false });
    this.update();
  }

  drop() {
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;
    const moved = drag.target.some((id, i) => id !== drag.order[i]);
    // The list re-renders in the new order first; the offsets are cleared right after.
    if (moved) this.setDropped({ from: drag.order.join(), to: drag.target });
    this.setDragId(null);
    if (moved) this.callbacks.onDrop(drag.target);
    this.callbacks.onEnd();
  }

  resetAnimations() {
    this.dragY.stopAnimation();
    this.dragY.setValue(0);
    for (const value of this.shifts.values()) {
      value.stopAnimation();
      value.setValue(0);
    }
    this.shiftTargets.clear();
  }

  onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    this.scroll.offset = e.nativeEvent.contentOffset.y;
  };

  onViewportLayout = (e: LayoutChangeEvent) => {
    this.scroll.viewport = e.nativeEvent.layout.height;
  };

  onContentSize = (_width: number, height: number) => {
    this.scroll.content = height;
  };

  onCardLayout(id: string, e: LayoutChangeEvent) {
    this.heights[id] = e.nativeEvent.layout.height;
    // A card resized under the finger (cards fold up when a drag starts).
    if (this.drag) this.update();
  }
}

/**
 * Drag-to-reorder for a vertical list of cards inside a ScrollView. Returns the order to
 * draw (the dropped order shows at once, before the saved one loads) and the pieces to wire up.
 */
export function useDragReorder(ids: readonly string[], layout: ListLayout, callbacks: Callbacks) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropped, setDropped] = useState<{ from: string; to: string[] } | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const containerRef = useRef<HostInstance>(null);
  const [controller] = useState(
    () => new DragController(setDragId, setDropped, layout, scrollRef, containerRef),
  );

  useEffect(() => {
    controller.callbacks = callbacks;
  });

  // Clear the drag offsets once the list has re-rendered in its new order.
  useLayoutEffect(() => {
    if (dragId === null) controller.resetAnimations();
  }, [controller, dragId, dropped]);

  useEffect(() => {
    if (dragId === null) return;
    let frame = requestAnimationFrame(function tick() {
      controller.autoScroll();
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [controller, dragId]);

  const key = ids.join();
  // Until the list reloads in the saved order, show the dropped order.
  const order = dropped && dropped.from === key ? dropped.to : ids;
  return { controller, dragId, order, scrollRef, containerRef };
}
