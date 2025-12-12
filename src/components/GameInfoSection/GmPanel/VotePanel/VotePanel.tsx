import { UsergroupDeleteOutlined } from "@ant-design/icons";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { Timer } from "@/components/SpeakerTimer/Timer.tsx";
import { useBatchMediaControls } from "@/hooks/useBatchMediaControls.ts";
import { rootStore } from "@/store/rootStore.ts";

import styles from "./VotePanel.module.scss";

export const VotePanel = observer(() => {
  const { t } = useTranslation();
  const { gamesStore, usersStore } = rootStore;
  const { gameFlow, activeGameId, activeGameAlivePlayers } = gamesStore;
  const { myId } = usersStore;
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
  const { muteSpeaker } = useBatchMediaControls({
    roomId: activeGameId || "",
    requesterId: myId,
    allUserIds: activeGameAlivePlayers,
  });

  const handleVoteClick = useCallback(() => {
    updateGameFlow(
      {
        isVote: !gameFlow.isVote,
        speaker: "",
      },
      {
        onSuccess: () => {
          muteSpeaker(gameFlow.speaker);
        },
      }
    );
  }, [gameFlow.isVote, gameFlow.speaker, muteSpeaker, updateGameFlow]);

  const needVote = gameFlow.proposed.length > 1 && gameFlow.isVote;
  const text = needVote ? t("vote.voting") : t("vote.startVoting");

  return (
    <div
      className={classNames(styles.container, {
        [styles.startPosition]: needVote,
      })}
      onClick={handleVoteClick}
    >
      {!!gameFlow.proposed.length && (
        <>
          <UsergroupDeleteOutlined />
          <span>{text}</span>
        </>
      )}

      {needVote && (
        <Timer timer={gameFlow.votesTime} resetTrigger={gameFlow.isReVote} />
      )}
    </div>
  );
});
