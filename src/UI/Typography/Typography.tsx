import { PropsWithChildren } from "react";
import classNames from "classnames";
import styles from "./Typography.module.scss";

type TypographyProps = PropsWithChildren<{
  variant: "h1" | "h2" | "h3" | "title" | "subtitle" | "p" | "span";
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
    p: "p",
    span: "span",
  };

  const Tag = variantsMap[variant] as keyof JSX.IntrinsicElements;

  return (
    <Tag className={classNames(className, styles[variant])}>{children}</Tag>
  );
};
