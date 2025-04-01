import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { forwardRef, memo, useCallback, useState } from "react";

import { Input, InputProps } from "../Input.tsx";

export const InputPassword = memo(
  forwardRef<HTMLInputElement, InputProps>((props, ref) => {
    const [isHidden, setIsHidden] = useState<boolean>(true);

    const handleToggleVisibility = useCallback(() => {
      setIsHidden((prev) => !prev);
    }, []);

    const icon = isHidden ? <EyeOutlined /> : <EyeInvisibleOutlined />;
    const type = isHidden ? "password" : "text";

    return (
      <Input
        {...props}
        type={type}
        ref={ref}
        iconRight={icon}
        onIconRightClick={handleToggleVisibility}
      />
    );
  }),
);
