import { Outlet } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Header } from "@/components/Header";
import { MainContainer } from "@/components/MainContainer";
import { Footer } from "@/components/Footer";
import styles from "./layout.module.scss";
import { usersStore } from "../store/usersStore.ts";

export const RootLayout = observer(() => {
  const { me } = usersStore;

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
