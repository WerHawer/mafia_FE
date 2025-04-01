import { HomeFilled, SettingFilled } from "@ant-design/icons";
import classNames from "classnames";
import { NavLink } from "react-router-dom";

import { routes } from "@/router/routs.ts";

import styles from "./Nav.module.scss";

const links = [
  { to: routes.home, label: "Home", icon: <HomeFilled /> },
  { to: routes.settings, label: "Settings", icon: <SettingFilled /> },
];

export const HeaderNav = () => {
  return (
    <nav className={styles.navContainer}>
      <ul className={styles.LinksList}>
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              className={({ isActive }) =>
                isActive
                  ? classNames(styles.Link, styles.LinkActive)
                  : styles.Link
              }
              to={link.to}
              title={link.label}
            >
              {link.icon}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
