import classNames from "classnames";
import { PropsWithChildren, forwardRef } from "react";

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

export const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ children, variant = "p", className }, ref) => {
    const variantsMap: Record<string, keyof JSX.IntrinsicElements> = {
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

    const Tag = variantsMap[variant] as React.ElementType;

    return (
      <Tag ref={ref} className={classNames(className, styles[variant])}>
        {children}
      </Tag>
    );
  }
);

Typography.displayName = "Typography";
