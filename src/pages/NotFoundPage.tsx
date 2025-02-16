import { Link } from "react-router-dom";
import { routes } from "@/router/routs";
import styles from "./NotFoundPage.module.scss";

const NotFoundPage = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>404</h1>
      <h2 className={styles.subtitle}>Сторінку не знайдено</h2>
      <p className={styles.description}>
        Вибачте, але сторінка, яку ви шукаєте, не існує.
      </p>
      <Link to={routes.home} className={styles.button}>
        Повернутися на головну
      </Link>
    </div>
  );
};

NotFoundPage.displayName = "NotFoundPage";

export default NotFoundPage;
