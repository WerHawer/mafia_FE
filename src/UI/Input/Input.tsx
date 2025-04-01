import classNames from "classnames";
import { forwardRef, HTMLProps, memo, ReactNode } from "react";

import { Button } from "@/UI/Button";
import { ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

import styles from "./Input.module.scss";

export type InputProps = HTMLProps<HTMLInputElement> & {
  width?: number | string;
  error?: string;
  iconRight?: ReactNode;
  onIconRightClick?: () => void;
};

export const Input = memo(
  forwardRef<HTMLInputElement, InputProps>(
    ({ error, className, iconRight, onIconRightClick, ...restProps }, ref) => {
      return (
        <div className={styles.container}>
          <div className={classNames(className, styles.inputContainer, {})}>
            <input
              {...restProps}
              placeholder=""
              value={restProps.value}
              className={classNames(styles.input, {
                [styles.withValue]: !!restProps.value,
                [styles.withError]: !!error,
              })}
              autoComplete="new-password"
              ref={ref}
            />

            <span className={styles.pseudoPlaceholder}>
              {restProps.placeholder}
            </span>

            {iconRight && (
              <Button
                className={classNames(styles.icon, styles.iconRight, {
                  [styles.withError]: !!error,
                })}
                variant={ButtonVariant.Tertiary}
                onClick={onIconRightClick}
              >
                {iconRight}
              </Button>
            )}
          </div>

          {error && <span className={styles.errorText}>{error}</span>}
        </div>
      );
    }
  )
);
