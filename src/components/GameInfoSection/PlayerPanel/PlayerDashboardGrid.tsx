import {
  CompressOutlined,
  DislikeFilled,
  DislikeOutlined,
  ExpandOutlined,
} from "@ant-design/icons";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import {
  KeyboardEvent,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import bulletIcon from "@/assets/icons/bullet.png";
import { useGameVote } from "@/components/GameVote/useGameVote.ts";
import { canSeeMafiaShot } from "@/helpers/mafiaShot.ts";
import { useNightTargetAction } from "@/hooks/useNightTargetAction.ts";
import { useSpeechProposePlayer } from "@/hooks/useSpeechProposePlayer.ts";
import { rootStore } from "@/store/rootStore.ts";
import { SoundEffect } from "@/store/soundStore.ts";
import { Roles } from "@/types/game.types.ts";
import { UserId } from "@/types/user.types.ts";
import Tippy from "@tippyjs/react";

import styles from "./PlayerDashboardGrid.module.scss";

const CENTER_ACTION_POSITION = 50;
const INVESTIGATE_RESULT_VISIBLE_MS = 2500;

const NIGHT_ACTION_ROLES = [
  Roles.Mafia,
  Roles.Don,
  Roles.Sheriff,
  Roles.Doctor,
  Roles.Prostitute,
];

const MIN_PLAYERS_TO_SHOW_LIST_HEIGHT_TOGGLE = 5;

/** Повинно збігатися з `$player-dashboard-compact-grid-max-height` у SCSS. */
const PLAYER_LIST_COMPACT_MAX_HEIGHT_PX = 105;

const PLAYER_NAME_TOOLTIP_SHOW_DELAY_MS = 1000;
const TEXT_TRUNCATION_TOLERANCE_PX = 1;

const useIsSingleLineTruncated = (fullText: string) => {
  const elementReference = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const measureTruncation = useCallback((): void => {
    const element = elementReference.current;

    if (!element) return;

    setIsTruncated(
      element.scrollWidth > element.clientWidth + TEXT_TRUNCATION_TOLERANCE_PX,
    );
  }, []);

  useLayoutEffect(() => {
    measureTruncation();
  }, [measureTruncation, fullText]);

  useLayoutEffect(() => {
    const element = elementReference.current;

    if (!element) return undefined;

    const resizeObserver = new ResizeObserver(measureTruncation);
    resizeObserver.observe(element);

    return (): void => {
      resizeObserver.disconnect();
    };
  }, [measureTruncation]);

  return {
    truncationReference: elementReference,
    isTruncated,
  };
};

type PlayerDashboardGridItemProps = {
  userId: UserId;
  playerNumber: number;
  displayName?: string;
  proposed: UserId[];
  proposedBy?: Record<UserId, UserId>;
  voted?: Record<UserId, UserId[]>;
  canVote: boolean;
  amIVoted: boolean;
  votedUserId: UserId | null;
  myId: UserId;
  onVoteForPlayer: (userId: UserId) => void;
};

const PlayerDashboardGridItem = observer(
  ({
    userId,
    playerNumber,
    displayName,
    proposed,
    proposedBy,
    voted,
    canVote,
    amIVoted,
    votedUserId,
    myId,
    onVoteForPlayer,
  }: PlayerDashboardGridItemProps) => {
    const { t } = useTranslation();
    const [investigateResult, setInvestigateResult] = useState<string | null>(
      null
    );
    const { gamesStore, soundStore, myRole, isIDead, isISpeaker, isIGM } =
      rootStore;
    const { getUser, getUserName } = rootStore.usersStore;
    const { gameFlow, activeGameKilledPlayers } = gamesStore;
    const { isNight, isVote, isReVote, day, speaker, shoot = {} } = gameFlow;
    const safeProposed = proposed ?? [];
    const safeProposedBy = proposedBy ?? {};
    const safeVoted = voted ?? {};
    const user = getUser(userId);
    const userName =
      displayName ?? user?.nikName ?? getUserName(userId) ?? "Unknown";
    const {
      truncationReference: playerNameTruncationReference,
      isTruncated: isPlayerNameTruncated,
    } = useIsSingleLineTruncated(userName);
    const proposerId = safeProposedBy[userId];
    const proposer = proposerId ? getUser(proposerId) : undefined;
    const proposerName = proposerId
      ? proposer?.nikName ?? getUserName(proposerId)
      : undefined;
    const isProposed = safeProposed.includes(userId);
    const isDead = activeGameKilledPlayers.includes(userId);
    const isSpeaker = speaker === userId;
    const isVotedByMe = votedUserId === userId;
    const voteCount = safeVoted[userId]?.length ?? 0;
    const shotCount = shoot[userId]?.shooters?.length ?? 0;
    const hasVotingOccurred = Object.keys(safeVoted).length > 0;
    const votersList = useMemo(
      () => (safeVoted[userId] ?? []).map((id) => getUserName(id) ?? "Unknown"),
      [getUserName, userId, safeVoted]
    );

    const { canPropose, onPropose } = useSpeechProposePlayer({ userId });
    const {
      isShootEnabled,
      isKissEnabled,
      isHealEnabled,
      isInvestigateEnabled,
      onShootUser,
      onBlockUser,
      onHealUser,
      onInvestigateUser,
    } = useNightTargetAction({ userId, isMyStream: userId === myId });

    const canVoteForTarget =
      canVote && !amIVoted && isProposed && userId !== myId && !isDead;
    const canUseNightAction =
      !isIGM &&
      (isShootEnabled ||
        isKissEnabled ||
        isHealEnabled ||
        isInvestigateEnabled);
    const shouldShowNominationState =
      !isNight && !isVote && !isReVote && !hasVotingOccurred;
    const shouldShowProposeIcon = shouldShowNominationState && canPropose;
    const shouldShowProposedIcon =
      shouldShowNominationState && isProposed && !canPropose;
    const shouldShowShotIcon =
      canSeeMafiaShot({ role: myRole, gameFlow }) && shotCount > 0;
    const canInteract = isVote
      ? canVoteForTarget
      : isNight
        ? canUseNightAction
        : canPropose;

    const isVoteChoiceWindow = canVote && !amIVoted;
    const isDayProposeWindow =
      !isNight &&
      !isVote &&
      !isReVote &&
      day > 1 &&
      !isIDead &&
      (isISpeaker || isIGM);
    const isNightActionWindow =
      isNight &&
      !isIDead &&
      rootStore.isIWakedUp &&
      NIGHT_ACTION_ROLES.includes(myRole);
    const shouldShowUnavailable =
      (isVoteChoiceWindow || isDayProposeWindow || isNightActionWindow) &&
      !canInteract;

    const onActivate = useCallback((): void => {
      if (!canInteract) return;

      if (isVote) {
        onVoteForPlayer(userId);
        soundStore.playSfx(SoundEffect.Vote);

        return;
      }

      if (!isNight) {
        onPropose();

        return;
      }

      if (isShootEnabled) {
        onShootUser(CENTER_ACTION_POSITION, CENTER_ACTION_POSITION);
        soundStore.playSfx(SoundEffect.Shot, 0.7);

        return;
      }

      if (isKissEnabled) {
        onBlockUser(CENTER_ACTION_POSITION, CENTER_ACTION_POSITION);
        soundStore.playSfx(SoundEffect.Kiss);

        return;
      }

      if (isHealEnabled) {
        onHealUser();
        soundStore.playSfx(SoundEffect.Heal, 0.7);

        return;
      }

      if (isInvestigateEnabled) {
        const result = onInvestigateUser();

        if (result) {
          setInvestigateResult(result.result);
          rootStore.showInvestigatePreview({
            targetUserId: userId,
            clickPosition: {
              x: CENTER_ACTION_POSITION,
              y: CENTER_ACTION_POSITION,
            },
            result: result.result,
            isFound: result.isFound,
            role: result.role,
          });
          soundStore.playSfx(SoundEffect.Check);
          window.setTimeout(
            () => setInvestigateResult(null),
            INVESTIGATE_RESULT_VISIBLE_MS
          );
        }
      }
    }, [
      canInteract,
      isVote,
      isNight,
      isShootEnabled,
      isKissEnabled,
      isHealEnabled,
      isInvestigateEnabled,
      onVoteForPlayer,
      userId,
      soundStore,
      onPropose,
      onShootUser,
      onBlockUser,
      onHealUser,
      onInvestigateUser,
    ]);

    const onKeyDown = useCallback(
      (event: KeyboardEvent<HTMLLIElement>): void => {
        if (!canInteract || (event.key !== "Enter" && event.key !== " ")) {
          return;
        }

        event.preventDefault();
        onActivate();
      },
      [canInteract, onActivate]
    );

    return (
      <li
        className={classNames(styles.playerItem, {
          [styles.clickable]: canInteract,
          [styles.unavailable]: shouldShowUnavailable,
          [styles.shootable]: isShootEnabled,
          [styles.kissable]: isKissEnabled,
          [styles.healable]: isHealEnabled,
          [styles.checkable]: isInvestigateEnabled,
          [styles.dead]: isDead,
          [styles.speaker]: isSpeaker,
          [styles.voted]: isVotedByMe,
        })}
        onClick={canInteract ? onActivate : undefined}
        role={canInteract ? "button" : undefined}
        tabIndex={canInteract ? 0 : undefined}
        onKeyDown={onKeyDown}
        aria-label={canInteract ? t("vote.voteAgainst") : undefined}
      >
        <div className={styles.playerMain}>
          <span className={styles.playerIdentity}>
            <span className={styles.playerNumber}>#{playerNumber}</span>
            <Tippy
              content={userName}
              theme="role-tooltip"
              delay={[PLAYER_NAME_TOOLTIP_SHOW_DELAY_MS, 0]}
              disabled={!isPlayerNameTruncated}
            >
              <span
                ref={playerNameTruncationReference}
                className={styles.playerName}
              >
                {userName}
              </span>
            </Tippy>
            {isDead ? (
              <span className={styles.ghostIcon} aria-label="dead player">
                👻
              </span>
            ) : null}
          </span>

          <span className={styles.actionState}>
            {shouldShowShotIcon ? (
              <span className={styles.shotIconWrapper}>
                <img
                  src={bulletIcon}
                  alt="shot"
                  className={classNames(styles.shotIcon, {
                    [styles.shotIconActive]: isShootEnabled,
                  })}
                />
                {shotCount > 1 ? (
                  <span className={styles.shotCount}>{shotCount}</span>
                ) : null}
              </span>
            ) : null}

            {shouldShowProposeIcon || shouldShowProposedIcon ? (
              <span
                className={classNames(styles.voteIcon, {
                  [styles.voteIconActive]: shouldShowProposedIcon,
                  [styles.voteIconClickable]: canPropose,
                })}
              >
                {shouldShowProposedIcon ? (
                  <DislikeFilled />
                ) : (
                  <DislikeOutlined />
                )}
              </span>
            ) : null}

            {(isVote || voteCount > 0) && isProposed ? (
              <span
                className={classNames(styles.voteIcon, {
                  [styles.voteIconActive]: isVotedByMe,
                  [styles.voteIconClickable]: canVoteForTarget,
                })}
              >
                {isVotedByMe ? <DislikeFilled /> : <DislikeOutlined />}
                {voteCount > 0 ? (
                  <span className={styles.voteCount}>{voteCount}</span>
                ) : null}
              </span>
            ) : null}
          </span>
        </div>

        {shouldShowNominationState && isProposed && proposerName ? (
          <div className={styles.proposeFlow}>
            <span className={styles.proposerName}>by {proposerName}</span>
          </div>
        ) : null}

        {isVote && votersList.length > 0 ? (
          <div className={styles.votersRow}>{votersList.join(", ")}</div>
        ) : null}

        {investigateResult ? (
          <div className={styles.investigateResult}>{investigateResult}</div>
        ) : null}
      </li>
    );
  }
);

PlayerDashboardGridItem.displayName = "PlayerDashboardGridItem";

type PlayerDashboardGridProps = {
  /** Якщо false — без обмеження висоти й без перемикача компактного вигляду. */
  enableCompactPlayerListToggle?: boolean;
};

export const PlayerDashboardGrid = observer(
  ({ enableCompactPlayerListToggle = true }: PlayerDashboardGridProps) => {
    const { t } = useTranslation();
    const { gamesStore } = rootStore;
    const {
      proposed,
      proposedBy,
      voted,
      canVote,
      amIVoted,
      votedUserId,
      myId,
      onVoteForPlayer,
    } = useGameVote();
    const { activeGamePlayersWithoutGM } = gamesStore;
    const players = activeGamePlayersWithoutGM.map((userId) => ({ id: userId }));

    const stablePlayerNumberById = useMemo(() => {
      return players.reduce<Record<UserId, number>>(
        (accumulator, player, index) => {
          accumulator[player.id] = index + 1;

          return accumulator;
        },
        {}
      );
    }, [players]);

    const orderedPlayers = [...players].sort((firstPlayer, secondPlayer) => {
      const firstIsProposed = proposed.includes(firstPlayer.id);
      const secondIsProposed = proposed.includes(secondPlayer.id);

      if (firstIsProposed === secondIsProposed) return 0;

      return firstIsProposed ? -1 : 1;
    });

    const orderedPlayerIdsKey = useMemo(
      () => orderedPlayers.map((player) => player.id).join(),
      [orderedPlayers]
    );

    const [isPlayerListCompact, setPlayerListCompact] = useState(false);
    const listRef = useRef<HTMLUListElement>(null);
    const [measuredFullListHeightPx, setMeasuredFullListHeightPx] = useState(
      PLAYER_LIST_COMPACT_MAX_HEIGHT_PX
    );
    const [isListMotionReady, setListMotionReady] = useState(false);

    const shouldUsePlayerListCompactShell =
      enableCompactPlayerListToggle &&
      orderedPlayers.length >= MIN_PLAYERS_TO_SHOW_LIST_HEIGHT_TOGGLE;

    useLayoutEffect(() => {
      const el = listRef.current;

      if (!el || !shouldUsePlayerListCompactShell) {
        setListMotionReady(false);

        return;
      }

      const measure = (): void => {
        setMeasuredFullListHeightPx(
          Math.max(
            PLAYER_LIST_COMPACT_MAX_HEIGHT_PX,
            Math.ceil(el.scrollHeight + orderedPlayers.length * 2)
          )
        );
      };

      measure();
      setListMotionReady(true);
      const ro = new ResizeObserver(measure);
      ro.observe(el);

      return (): void => {
        ro.disconnect();
      };
    }, [shouldUsePlayerListCompactShell, orderedPlayerIdsKey]);

    const onPlayerListCompactToggleClick = (): void => {
      setPlayerListCompact((compact) => !compact);
    };

    if (!orderedPlayers.length) return null;

    const playerListAriaId = "player-dashboard-grid-list";

    const playerListMarkup = (
      <ul
        ref={listRef}
        id={playerListAriaId}
        className={classNames(
          styles.grid,
          shouldUsePlayerListCompactShell
            ? styles.gridInAnimatedShell
            : styles.gridScrollLocal,
          {
            [styles.withBottomMargin]:
              orderedPlayers.length >= MIN_PLAYERS_TO_SHOW_LIST_HEIGHT_TOGGLE,
          }
        )}
      >
        {orderedPlayers.map(({ id }) => (
          <PlayerDashboardGridItem
            key={id}
            userId={id}
            playerNumber={stablePlayerNumberById[id]!}
            proposed={proposed}
            proposedBy={proposedBy}
            voted={voted}
            canVote={canVote}
            amIVoted={amIVoted}
            votedUserId={votedUserId}
            myId={myId}
            onVoteForPlayer={onVoteForPlayer}
          />
        ))}
      </ul>
    );

    const shellMaxHeightPx = isPlayerListCompact
      ? PLAYER_LIST_COMPACT_MAX_HEIGHT_PX
      : measuredFullListHeightPx;

    return (
      <div className={styles.gridRoot}>
        <div
          className={classNames(styles.gridOuter, {
            [styles.gridOuterShell]: shouldUsePlayerListCompactShell,
            [styles.gridOuterShellMotion]:
              shouldUsePlayerListCompactShell && isListMotionReady,
            [styles.gridOuterWithCornerToggle]:
              shouldUsePlayerListCompactShell,
          })}
          style={
            shouldUsePlayerListCompactShell
              ? { maxHeight: shellMaxHeightPx }
              : undefined
          }
        >
          {shouldUsePlayerListCompactShell ? (
            <>
              <button
                type="button"
                className={styles.compactHeightToggle}
                aria-label={
                  isPlayerListCompact
                    ? t("game.expandPlayerList")
                    : t("game.collapsePlayerList")
                }
                aria-expanded={!isPlayerListCompact}
                aria-controls={playerListAriaId}
                onClick={onPlayerListCompactToggleClick}
              >
                {isPlayerListCompact ? (
                  <ExpandOutlined className={styles.compactHeightToggleIcon} />
                ) : (
                  <CompressOutlined className={styles.compactHeightToggleIcon} />
                )}
              </button>
              <div className={styles.gridListScrollViewport}>
                {playerListMarkup}
              </div>
            </>
          ) : (
            playerListMarkup
          )}
        </div>
      </div>
    );
  }
);

PlayerDashboardGrid.displayName = "PlayerDashboardGrid";
