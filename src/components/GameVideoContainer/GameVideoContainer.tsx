import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

import { useGridLayout } from "@/hooks/useGridLayout.ts";
import { useNightMode } from "@/hooks/useNightMode.ts";

import { NightMode } from "../NightMode";
import styles from "./GameVideoContainer.module.scss";
import { VideoGrid } from "./VideoGrid.tsx";

type GameVideoContainerProps = {
  className?: string;
};

const ANIMATION_DURATION = 400;

export const GameVideoContainer = observer(
  ({ className }: GameVideoContainerProps) => {
    const { shouldShowVideos } = useNightMode();
    const gridLayout = useGridLayout();

    const [showNightMode, setShowNightMode] = useState(!shouldShowVideos);
    const [isNightModeVisible, setIsNightModeVisible] =
      useState(!shouldShowVideos);

    useEffect(() => {
      if (!shouldShowVideos) {
        setShowNightMode(true);
        setIsNightModeVisible(true);
      } else {
        setIsNightModeVisible(false);

        const timer = setTimeout(() => {
          setShowNightMode(false);
        }, ANIMATION_DURATION);

        return () => clearTimeout(timer);
      }
    }, [shouldShowVideos]);

    return (
      <div
        className={classNames(
          styles.container,
          {
            [styles.twoGrid]: gridLayout.two,
            [styles.threeGrid]: gridLayout.three,
            [styles.fourGrid]: gridLayout.four,
            [styles.fiveGrid]: gridLayout.five,
          },
          className
        )}
      >
        <VideoGrid />

        {showNightMode && <NightMode isVisible={isNightModeVisible} />}
      </div>
    );
  }
);

GameVideoContainer.displayName = "GameVideoContainer";
