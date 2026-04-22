import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { useGridLayout } from "@/hooks/useGridLayout.ts";
import { useNightMode } from "@/hooks/useNightMode.ts";
import { useVoteResult } from "@/hooks/useVoteResult.ts";
import { rootStore } from "@/store/rootStore.ts";

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
    const { isIGM } = rootStore;
    const { activeGameAlivePlayers, gameFlow } = rootStore.gamesStore;
    const { isVote, isReVote } = gameFlow;
    const { t } = useTranslation();

    // Called ONCE here (not in every VoteFlow instance) to prevent randomVote firing N times
    useVoteResult({ alivePlayers: activeGameAlivePlayers, isIGM });

    // Show toast when voting round starts (isVote: false → true)
    const prevIsVoteRef = useRef(isVote);
    useEffect(() => {
      const wasVote = prevIsVoteRef.current;
      prevIsVoteRef.current = isVote;

      if (!wasVote && isVote) {
        if (isReVote) {
          toast(t("vote.toastRevoteStarted"), { icon: "🔄", duration: 4000 });
        } else {
          toast(t("vote.toastVoteStarted"), { icon: "🗳️", duration: 4000 });
        }
      }
    }, [isVote, isReVote, t]);

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
