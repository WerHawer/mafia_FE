import styles from "./GamePage.module.scss";
import classNames from "classnames";

export const GamePage = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.leftContainer}>left</div>
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
