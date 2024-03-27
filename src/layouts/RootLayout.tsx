import { Header } from "../components/Header";
import { Outlet } from "react-router-dom";
import { MainContainer } from "../components/MainContainer";
import { Footer } from "../components/Footer";
import styles from "./layout.module.scss";
import { userStore } from "../store/mobx/userStore.ts";
import { observer } from "mobx-react-lite";

export const RootLayout = observer(() => {
  const { me } = userStore;

  return (
    <div className={styles.rootContainer}>
      {me && <Header />}
      <MainContainer>
        <Outlet />
      </MainContainer>
      <Footer />
    </div>
  );
});
