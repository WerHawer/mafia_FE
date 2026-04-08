import { useEffect, useState } from "react";

const INDEX_RATIO = 0.57;

export const useCalculateProportions = (container?: HTMLDivElement | null) => {
  const [isWidthProportion, setIsWidthProportion] = useState(false);

  useEffect(() => {
    if (!container) return;

    // Use clientWidth/clientHeight for initial check — not affected by parent CSS transforms
    const { clientWidth, clientHeight } = container;
    if (clientWidth && clientHeight) {
      setIsWidthProportion(clientHeight / clientWidth < INDEX_RATIO);
    }

    // ResizeObserver contentRect gives real layout dimensions (not transform-affected)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width && height) {
          setIsWidthProportion(height / width < INDEX_RATIO);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [container]);

  return isWidthProportion;
};
