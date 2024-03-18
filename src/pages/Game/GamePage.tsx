import styles from "./GamePage.module.scss";
import classNames from "classnames";
import { GameVideoContainer } from "../../components/GameVideoContainer";

export const GamePage = () => {
  return (
    <div className={styles.pageContainer}>
      <GameVideoContainer />
      <aside className={styles.rightContainer}>
        <section
          className={classNames(styles.asideSection, styles.personalInfo)}
        >
          info
        </section>
        <section className={classNames(styles.asideSection, styles.voteList)}>
          vote
        </section>
        <section className={styles.chatContainer}>chat</section>
      </aside>
    </div>
  );
};
