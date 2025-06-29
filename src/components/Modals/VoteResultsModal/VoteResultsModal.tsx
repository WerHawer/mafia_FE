import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Draw } from "@/components/Modals/VoteResultsModal/Draw.tsx";
import { OneSelected } from "@/components/Modals/VoteResultsModal/OneSelected.tsx";
import { gamesStore } from "@/store/gamesStore.ts";

export type Result = [string, string[]];

export const VoteResultsModal = observer(() => {
  const { t } = useTranslation();
  const { gameFlow } = gamesStore;

  const result: Result[] | null = useMemo(() => {
    const { voted = {} } = gameFlow;

    const votesArr = Object.entries(voted);

    if (votesArr.length === 0) return null;

    const playerWithMaxVotes = votesArr.reduce(
      (acc, [player, votes]) =>
        votes.length > acc.votes ? { player, votes: votes.length } : acc,
      { player: null, votes: 0 } as { player: string | null; votes: number }
    );

    return votesArr.filter(
      ([, votes]) => votes.length === playerWithMaxVotes.votes
    );
  }, [gameFlow]);

  if (!result) return <h2>{t("voteResults.unexpectedResult")}</h2>;

  if (result.length > 1) return <Draw result={result} />;

  return <OneSelected result={result} />;
});
