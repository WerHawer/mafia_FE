import { NavLink } from "react-router-dom";
import classNames from "classnames";
import styles from "./Nav.module.scss";
import { routes } from "@/router/routs.ts";

const links = [{ to: routes.home, label: "Home" }];

export const HeaderNav = () => {
  return (
    <nav>
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
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
