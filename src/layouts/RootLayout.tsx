import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MainContainer } from "@/components/MainContainer";
import { observer } from "mobx-react-lite";
import { Outlet, useLocation } from "react-router-dom";
import { usersStore } from "../store/usersStore.ts";
import styles from "./layout.module.scss";

export const RootLayout = observer(() => {
  const { me } = usersStore;
  const location = useLocation();
  const isGamePage = location.pathname.includes("/game/");

  return (
    <div className={styles.rootContainer}>
      {me && !isGamePage && <Header />}

      <MainContainer>
        <Outlet />
      </MainContainer>

      {!isGamePage && <Footer />}
    </div>
  );
});
