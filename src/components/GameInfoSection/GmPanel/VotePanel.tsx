import { UsergroupDeleteOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { Timer } from "@/components/SpeakerTimer/Timer.tsx";
import { rootStore } from "@/store/rootStore.ts";

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

  return (
    <>
      {!!gameFlow.proposed.length && (
        <UsergroupDeleteOutlined
          onClick={handleVoteClick}
          style={{ cursor: "pointer" }}
        />
      )}

      {gameFlow.isVote && gameFlow.proposed.length > 1 && (
        <Timer timer={gameFlow.votesTime} resetTrigger={gameFlow.isReVote} />
      )}
    </>
  );
});
