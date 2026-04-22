import { CheckOutlined } from "@ant-design/icons";
import { ReactNode } from "react";

import { MenuItem } from "@/UI";
import { MenuItemVariant } from "@/UI/Menu/MenuTypes.ts";
import { useDeviceList } from "@/hooks/useDeviceList.ts";

type DeviceMenuItemsProps = {
  kind: MediaDeviceKind;
  activeDeviceId: string;
  onSelect: (deviceId: string) => void;
  icon: ReactNode;
  placeholder?: string;
  closeMenu: () => void;
};

export const DeviceMenuItems = ({
  kind,
  activeDeviceId,
  onSelect,
  icon,
  placeholder = "Default device",
  closeMenu,
}: DeviceMenuItemsProps) => {
  const devices = useDeviceList(kind);

  if (devices.length === 0) {
    return null;
  }

  return (
    <>
      {devices.map((d, index) => {
        const isActive = d.deviceId === activeDeviceId || (activeDeviceId === "" && d.deviceId === "default");
        const labelStr = d.label || `${placeholder} ${index + 1}`;
        return (
          <MenuItem
            key={d.deviceId || index}
            icon={isActive ? <CheckOutlined /> : icon}
            label={
              <div
                style={{
                  maxWidth: "240px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={labelStr}
              >
                {labelStr}
              </div>
            }
            onClick={() => {
              onSelect(d.deviceId);
              closeMenu();
            }}
            variant={isActive ? MenuItemVariant.Success : MenuItemVariant.Default}
          />
        );
      })}
    </>
  );
};
