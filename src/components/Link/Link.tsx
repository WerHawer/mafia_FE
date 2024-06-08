import { PropsWithChildren } from "react";
import { Link as ReactLink } from "react-router-dom";
import styles from "./Link.module.scss";
import classNames from "classnames";

type LinkProps = PropsWithChildren<{
  to: string;
  className?: string;
}>;

export const Link = ({ to, children, className }: LinkProps) => {
  return (
    <ReactLink className={classNames(className, styles.link)} to={to}>
      {children}
    </ReactLink>
  );
};
