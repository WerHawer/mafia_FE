import { useGetUsersWithAddToStore } from "../../api/user/queries.ts";
import { usersStore } from "../../store/usersStore.ts";
import { observer } from "mobx-react-lite";
import { gamesStore } from "../../store/gamesStore.ts";
import styles from "./GameInfoSection.module.scss";
import { GmPanel } from "./GmPanel";
import { PlayerPanel } from "./PlayerPanel.tsx";

export const GameInfoSection = observer(() => {
  const { activeGameGm, activeGaveUserIds } = gamesStore;
  const { myId } = usersStore;
  const isPlayerGM = activeGameGm === myId;

  useGetUsersWithAddToStore(activeGaveUserIds);

  return (
    <div className={styles.container}>
      {isPlayerGM ? <GmPanel /> : <PlayerPanel />}

      {/*<ul className={styles.list}>*/}
      {/*  {!isUsersLoading && activeGamePlayers*/}
      {/*    ? activeGamePlayers.map((id) => (*/}
      {/*        <li*/}
      {/*          key={id}*/}
      {/*          className={classNames(styles.roles, {*/}
      {/*            [styles.mafia]: activeGameRoles?.mafia?.includes(id),*/}
      {/*            [styles.citizen]: activeGameRoles?.citizens?.includes(id),*/}
      {/*            [styles.cherif]: activeGameRoles?.cherif === id,*/}
      {/*            [styles.doctor]: activeGameRoles?.doctor === id,*/}
      {/*            [styles.maniac]: activeGameRoles?.maniac === id,*/}
      {/*            [styles.prostitute]: activeGameRoles?.prostitute === id,*/}
      {/*            [styles.gm]: id === activeGameGm,*/}
      {/*          })}*/}
      {/*        >*/}
      {/*          {getUser(id).name};*/}
      {/*        </li>*/}
      {/*      ))*/}
      {/*    : null}*/}
      {/*</ul>*/}

      {/*<div className={styles.footer}>*/}
      {/*  <Button variant={ButtonVariant.Primary} onClick={handleSetRoles}>*/}
      {/*    Set roles*/}
      {/*  </Button>*/}
      {/*</div>*/}
    </div>
  );
});

GameInfoSection.displayName = "GameInfoSection";
