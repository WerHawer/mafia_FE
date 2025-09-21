import { throttle } from "lodash";
import { useCallback, useEffect, useState } from "react";

const INDEX_RATIO = 0.57;
const THROTTLE_DELAY = 150;

export const useCalculateProportions = (container?: HTMLDivElement | null) => {
  const [isWidthProportion, setIsWidthProportion] = useState(false);

  const getSizeDirection = useCallback(() => {
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    setIsWidthProportion(height / width < INDEX_RATIO);
  }, [container]);

  useEffect(() => {
    if (!container) return;

    getSizeDirection(); // Initial call

    const throttledResize = throttle(getSizeDirection, THROTTLE_DELAY);
    const resizeObserver = new ResizeObserver(throttledResize);

    resizeObserver.observe(container);

    return () => {
      if (container) {
        resizeObserver.unobserve(container);
      }
    };
  }, [container, getSizeDirection]);

  return isWidthProportion;
};
