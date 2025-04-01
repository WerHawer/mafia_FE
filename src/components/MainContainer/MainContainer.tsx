import { PropsWithChildren } from 'react';

import styles from './MainContainer.module.scss';

export const MainContainer = ({ children }: PropsWithChildren) => {
  return <main className={styles.container}>{children}</main>;
};
