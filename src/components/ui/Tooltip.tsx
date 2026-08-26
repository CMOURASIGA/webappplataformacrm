import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

export interface TooltipProps {
  content: React.ReactNode;
  /** Must be a single ref-forwarding element (a host element or a forwardRef component) — its DOM node positions the portal. */
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const GAP = 8;

/**
 * Lightweight tooltip. Renders through a portal into document.body and positions
 * itself from the trigger's bounding rect — required so it isn't clipped by a
 * scrollable/overflow-hidden ancestor (e.g. the sidebar's nav list) and always
 * paints above surrounding content via the shared z-index token.
 */
export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const id = useId();

  useLayoutEffect(() => {
    if (!visible || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    let top = rect.top;
    let left = rect.left;
    switch (side) {
      case 'top':
        top = rect.top - GAP;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + GAP;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - GAP;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + GAP;
        break;
    }
    setCoords({ top, left });
  }, [visible, side]);

  const setRefs = (node: HTMLElement | null) => {
    triggerRef.current = node;
    const childRef = (children as unknown as { ref?: React.Ref<unknown> }).ref;
    if (typeof childRef === 'function') childRef(node);
    else if (childRef && typeof childRef === 'object') (childRef as React.MutableRefObject<unknown>).current = node;
  };

  const translate = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  }[side];

  return (
    <>
      {React.cloneElement(children, {
        ref: setRefs,
        'aria-describedby': visible ? id : undefined,
        onMouseEnter: (event: React.MouseEvent) => {
          children.props.onMouseEnter?.(event);
          setVisible(true);
        },
        onMouseLeave: (event: React.MouseEvent) => {
          children.props.onMouseLeave?.(event);
          setVisible(false);
        },
        onFocus: (event: React.FocusEvent) => {
          children.props.onFocus?.(event);
          setVisible(true);
        },
        onBlur: (event: React.FocusEvent) => {
          children.props.onBlur?.(event);
          setVisible(false);
        },
      })}
      {visible && coords &&
        createPortal(
          <span
            role="tooltip"
            id={id}
            style={{ zIndex: 'var(--cs-z-tooltip)', top: coords.top, left: coords.left, position: 'fixed' }}
            className={cn(
              'pointer-events-none whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-cs-sm',
              translate,
              className
            )}
          >
            {content}
          </span>,
          document.body
        )}
    </>
  );
}
