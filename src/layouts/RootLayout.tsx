import { Header } from '../components/Header';
import { Outlet } from 'react-router-dom';
import { MainContainer } from '../components/MainContainer';
import { Footer } from '../components/Footer';
import styles from './layout.module.scss';

export const RootLayout = () => {
  return (
    <div className={styles.rootContainer}>
      <Header />
      <MainContainer>
        <Outlet />
      </MainContainer>
      <Footer />
    </div>
  );
};
