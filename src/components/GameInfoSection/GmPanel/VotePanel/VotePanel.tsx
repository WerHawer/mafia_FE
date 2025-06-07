import { UsergroupDeleteOutlined } from "@ant-design/icons";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { Timer } from "@/components/SpeakerTimer/Timer.tsx";
import { rootStore } from "@/store/rootStore.ts";

import styles from "./VotePanel.module.scss";

export const VotePanel = observer(() => {
  const { gamesStore } = rootStore;
  const { gameFlow } = gamesStore;
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  const handleVoteClick = useCallback(() => {
    updateGameFlow({
      isVote: !gameFlow.isVote,
      speaker: "",
    });
  }, [gameFlow, updateGameFlow]);

  const needVote = gameFlow.proposed.length > 1 && gameFlow.isVote;
  const text = needVote ? "Voting" : "Start Voting";

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
