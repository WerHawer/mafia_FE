import classNames from "classnames";
import { PropsWithChildren } from "react";

import styles from "./Typography.module.scss";

type TypographyProps = PropsWithChildren<{
  variant:
    | "h1"
    | "h2"
    | "h3"
    | "title"
    | "subtitle"
    | "body"
    | "caption"
    | "p"
    | "span";
  className?: string;
}>;

export const Typography = ({
  children,
  variant = "p",
  className,
}: TypographyProps) => {
  const variantsMap = {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    title: "h2",
    subtitle: "h4",
    body: "p",
    caption: "span",
    p: "p",
    span: "span",
  };

  const Tag = variantsMap[variant] as keyof JSX.IntrinsicElements;

  return (
    <Tag className={classNames(className, styles[variant])}>{children}</Tag>
  );
};
