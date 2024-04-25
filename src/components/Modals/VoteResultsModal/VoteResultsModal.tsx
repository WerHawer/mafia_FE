import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { gamesStore } from "@/store/gamesStore.ts";
import { Draw } from "@/components/Modals/VoteResultsModal/Draw.tsx";
import { OneSelected } from "@/components/Modals/VoteResultsModal/OneSelected.tsx";

export type Result = [string, string[]];

export const VoteResultsModal = observer(() => {
  const { gameFlow } = gamesStore;

  const result: Result[] | null = useMemo(() => {
    const { voted = {} } = gameFlow;

    const votesArr = Object.entries(voted);

    if (votesArr.length === 0) return null;

    const playerWithMaxVotes = votesArr.reduce(
      (acc, [player, votes]) =>
        votes.length > acc.votes ? { player, votes: votes.length } : acc,
      { player: null, votes: 0 } as { player: string | null; votes: number },
    );

    return votesArr.filter(
      ([, votes]) => votes.length === playerWithMaxVotes.votes,
    );
  }, [gameFlow]);

  if (!result) return <h2>Unexpected result</h2>;

  if (result.length > 1) return <Draw result={result} />;

  return <OneSelected result={result} />;
});
