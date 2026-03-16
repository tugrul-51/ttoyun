import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function AutoFitStage({ children, padding = 6, minScale = 0.78, fitHeight = true, scrollY = false }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [contentSize, setContentSize] = useState({ width: 1, height: 1 });

  useIsomorphicLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return undefined;

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const outerNode = outerRef.current;
        const innerNode = innerRef.current;
        if (!outerNode || !innerNode) return;
        const availableWidth = Math.max(outerNode.clientWidth - padding * 2, 1);
        const availableHeight = Math.max(outerNode.clientHeight - padding * 2, 1);
        const contentWidth = Math.max(innerNode.scrollWidth, innerNode.offsetWidth, 1);
        const contentHeight = Math.max(innerNode.scrollHeight, innerNode.offsetHeight, 1);
        const widthScale = availableWidth / contentWidth;
        const heightScale = fitHeight ? availableHeight / contentHeight : 1;
        const nextScale = Math.min(1, widthScale, heightScale);
        setScale(Number.isFinite(nextScale) ? Math.max(minScale, nextScale) : 1);
        setContentSize({ width: contentWidth, height: contentHeight });
      });
    };

    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    measure();
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [children, padding, minScale, fitHeight]);

  const scaledHeight = Math.max(contentSize.height * scale + padding * 2, 1);

  return (
    <div
      ref={outerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: scrollY || fitHeight ? '100%' : 'auto',
        overflowX: 'hidden',
        overflowY: scrollY ? 'auto' : 'visible',
        minHeight: 0,
        overscrollBehavior: 'contain',
        paddingBottom: scrollY ? padding : 0,
        paddingTop: scrollY ? 0 : padding,
      }}
    >
      <div style={{ position: 'relative', minHeight: scaledHeight, width: '100%' }}>
        <div
          ref={innerRef}
          style={{
            position: 'absolute',
            left: '50%',
            top: padding,
            width: 'max-content',
            minWidth: `calc(100% - ${padding * 2}px)`,
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: 'top center',
            willChange: 'transform',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
