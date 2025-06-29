import classNames from "classnames";
import { useNavigate } from "react-router-dom";

import { routes } from "@/router/routs.ts";

import styles from "./Logo.module.scss";

type LogoProps = {
  size?: "small" | "medium" | "large";
  position?: "center" | "left" | "right";
  className?: string;
};

export const Logo = ({
  size = "medium",
  position = "left",
  className,
}: LogoProps) => {
  const navigate = useNavigate();

  const onClick = () => {
    navigate(routes.home);
  };

  return (
    <div
      className={classNames(
        className,
        styles.logo,
        styles[size],
        styles[position]
      )}
      onClick={onClick}
    >
      Mafia
    </div>
  );
};
