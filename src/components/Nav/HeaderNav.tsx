import { BookFilled, HomeFilled, SettingFilled } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import classNames from "classnames";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { routes } from "@/router/routs.ts";

import styles from "./Nav.module.scss";

export const HeaderNav = () => {
  const { t } = useTranslation();

  const links = [
    { to: routes.home, tooltip: t("nav.home"), icon: <HomeFilled /> },
    {
      to: routes.settings,
      tooltip: t("settings.title"),
      icon: <SettingFilled />,
    },
    { to: routes.rules, tooltip: t("nav.rules"), icon: <BookFilled /> },
  ];

  return (
    <nav className={styles.navContainer}>
      <ul className={styles.LinksList}>
        {links.map((link) => (
          <li key={link.to}>
            <Tippy
              content={link.tooltip}
              theme="nav-tooltip"
              delay={[1000, 0]}
              placement="bottom"
              animation="shift-away"
            >
              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? classNames(styles.Link, styles.LinkActive)
                    : styles.Link
                }
                to={link.to}
              >
                {link.icon}
              </NavLink>
            </Tippy>
          </li>
        ))}
      </ul>
    </nav>
  );
};
