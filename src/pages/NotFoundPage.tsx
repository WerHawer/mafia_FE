import { routes } from "@/router/routs";
import { Button } from "@/UI/Button/Button";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styles from "./NotFoundPage.module.scss";

const NotFoundPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onReturnHome = () => {
    navigate(routes.home);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>404</h1>

      <h2 className={styles.subtitle}>{t("notFound.title")}</h2>

      <p className={styles.description}>{t("notFound.description")}</p>

      <Button onClick={onReturnHome}>{t("notFound.returnHome")}</Button>
    </div>
  );
};

NotFoundPage.displayName = "NotFoundPage";

export default NotFoundPage;
