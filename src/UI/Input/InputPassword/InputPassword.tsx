import { Input } from "../Input.tsx";
import { forwardRef, HTMLProps, memo, useCallback, useState } from "react";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { Button } from "../../Button";
import { ButtonVariant } from "../../Button/ButtonTypes.ts";
import styles from "./InputPassword.module.scss";

export const InputPassword = memo(
  forwardRef<HTMLInputElement, HTMLProps<HTMLInputElement>>((props, ref) => {
    const [isHidden, setIsHidden] = useState<boolean>(true);

    const handleToggleVisibility = useCallback(() => {
      setIsHidden((prev) => !prev);
    }, []);

    const icon = isHidden ? <EyeOutlined /> : <EyeInvisibleOutlined />;
    const type = isHidden ? "password" : "text";

    return (
      <div className={styles.inputContainer}>
        <Input {...props} type={type} ref={ref} />

        <Button
          className={styles.button}
          variant={ButtonVariant.Tertiary}
          onClick={handleToggleVisibility}
        >
          {icon}
        </Button>
      </div>
    );
  }),
);
