import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  useShootUserMutation,
  useUpdateGameFlowMutation,
} from "@/api/game/queries.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";
import { UserId } from "@/types/user.types.ts";

type UseNightTargetActionParams = {
  userId: UserId;
  isMyStream: boolean;
};

export type InvestigateResult = {
  result: string;
  isFound: boolean;
  role?: Roles;
};

const getRoundedPosition = (x?: number, y?: number) => {
  if (x === undefined || y === undefined) return undefined;

  return { x: Math.round(x), y: Math.round(y) };
};

export const useNightTargetAction = ({
  userId,
  isMyStream,
}: UseNightTargetActionParams) => {
  const {
    gamesStore,
    isIGM,
    myRole,
    isIWakedUp,
    isIProstitute,
    isIDead,
  } = rootStore;
  const { myId } = rootStore.usersStore;
  const { isUserGM, gameFlow, activeGameId } = gamesStore;
  const {
    shoot = {},
    killed = [],
    day,
    prostituteBlock,
    doctorSave,
    doctorSelfHealUsed,
    sheriffCheck,
    donCheck,
  } = gameFlow;
  const { t } = useTranslation();
  const { mutate: shootUser } = useShootUserMutation();
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  const isGM = isUserGM(userId);
  const isIMafia = myRole === Roles.Mafia || myRole === Roles.Don;
  const isIDidShot = Object.values(shoot).some((entry) =>
    entry.shooters?.includes(myId)
  );
  const isUserDead = killed.includes(userId);
  const isImmune = gamesStore.isUserImmune(userId);
  const mafiaCount = (gamesStore.activeGameRoles?.mafia ?? []).length;
  const skipFirstNightIfOneMafia =
    gamesStore.activeGame?.skipFirstNightIfOneMafia ?? true;
  const isFirstNightSkipped =
    day === 1 && mafiaCount === 1 && skipFirstNightIfOneMafia;
  const notFirstDay = day > 1 || isFirstNightSkipped;
  const canCurrentPlayerAct = !isIDead;

  const isShootEnabled =
    canCurrentPlayerAct &&
    !isGM &&
    !isUserDead &&
    !isImmune &&
    notFirstDay &&
    (isIGM || (isIMafia && isIWakedUp && !isIDidShot));

  const isIDoctor = myRole === Roles.Doctor;

  const isKissEnabled =
    canCurrentPlayerAct &&
    !isMyStream &&
    !isGM &&
    !isUserDead &&
    notFirstDay &&
    isIProstitute &&
    isIWakedUp &&
    !prostituteBlock;

  const isHealEnabled =
    canCurrentPlayerAct &&
    !isGM &&
    !isUserDead &&
    notFirstDay &&
    isIDoctor &&
    isIWakedUp &&
    !doctorSave &&
    (userId !== myId || !doctorSelfHealUsed);

  const isISheriff = myRole === Roles.Sheriff;
  const isIDon = myRole === Roles.Don;
  const wakeUpArr = Array.isArray(gameFlow.wakeUp)
    ? gameFlow.wakeUp
    : [gameFlow.wakeUp].filter(Boolean);
  const isWokenAsDon =
    isIDon &&
    isIWakedUp &&
    wakeUpArr.length === 1 &&
    (mafiaCount <= 1 ? isIDidShot : true);

  const isInvestigateEnabled =
    canCurrentPlayerAct &&
    !isGM &&
    !isUserDead &&
    notFirstDay &&
    ((isISheriff && isIWakedUp && !sheriffCheck && !isMyStream) ||
      (isIDon && isWokenAsDon && !donCheck && !isMyStream));

  const onShootUser = useCallback(
    (x?: number, y?: number): void => {
      if (!activeGameId || !isShootEnabled || isIGM) return;

      shootUser({
        gameId: activeGameId,
        targetUserId: userId,
        shooterId: myId,
        shot: getRoundedPosition(x, y),
      });
    },
    [activeGameId, isIGM, isShootEnabled, myId, shootUser, userId]
  );

  const onBlockUser = useCallback(
    (x?: number, y?: number): void => {
      if (!isKissEnabled) return;

      updateGameFlow({
        prostituteBlock: userId,
        prostituteBlockPos: getRoundedPosition(x, y),
      });
    },
    [isKissEnabled, updateGameFlow, userId]
  );

  const onHealUser = useCallback((): void => {
    if (!isHealEnabled) return;

    if (userId === myId) {
      updateGameFlow({ doctorSave: userId, doctorSelfHealUsed: true });

      return;
    }

    updateGameFlow({ doctorSave: userId });
  }, [isHealEnabled, myId, updateGameFlow, userId]);

  const onInvestigateUser = useCallback((): InvestigateResult | null => {
    if (!isInvestigateEnabled) return null;

    const userRole = gamesStore.getUserRole(userId);

    if (isISheriff) {
      const isMafia = userRole === Roles.Mafia || userRole === Roles.Don;
      updateGameFlow({ sheriffCheck: userId });

      return {
        result: isMafia ? t("checkRole.mafia") : t("checkRole.notMafia"),
        isFound: isMafia,
        role: isMafia ? Roles.Mafia : Roles.Citizen,
      };
    }

    if (isIDon) {
      const isSheriff = userRole === Roles.Sheriff;
      updateGameFlow({ donCheck: userId });

      return {
        result: isSheriff ? t("checkRole.sheriff") : t("checkRole.notSheriff"),
        isFound: isSheriff,
        role: isSheriff ? Roles.Sheriff : Roles.Citizen,
      };
    }

    return null;
  }, [
    gamesStore,
    isIDon,
    isInvestigateEnabled,
    isISheriff,
    t,
    updateGameFlow,
    userId,
  ]);

  return {
    isShootEnabled,
    isKissEnabled,
    isHealEnabled,
    isInvestigateEnabled,
    onShootUser,
    onBlockUser,
    onHealUser,
    onInvestigateUser,
  };
};
