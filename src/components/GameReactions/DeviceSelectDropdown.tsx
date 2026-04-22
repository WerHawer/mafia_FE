import { ReactNode, useState } from "react";
import classNames from "classnames";

import { Dropdown, Menu } from "@/UI";
import { useDeviceList } from "@/hooks/useDeviceList.ts";

import { DeviceMenuItems } from "./DeviceMenuItems";
import styles from "./DeviceSelectDropdown.module.scss";

type DeviceSelectDropdownProps = {
  kind: MediaDeviceKind;
  activeDeviceId: string;
  onSelect: (id: string) => void;
  icon: ReactNode;
  placeholder?: string;
};

export const DeviceSelectDropdown = ({
  kind,
  activeDeviceId,
  onSelect,
  icon,
  placeholder = "Device",
}: DeviceSelectDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const devices = useDeviceList(kind);

  const activeDevice = devices.find(
    (d) => d.deviceId === activeDeviceId || (activeDeviceId === "" && d.deviceId === "default")
  ) || devices[0];
  
  const activeLabel = activeDevice?.label || placeholder;

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
  };

  return (
    <Dropdown
      trigger={
        <button
          className={classNames(styles.triggerBtn, { [styles.active]: isOpen })}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={styles.iconWrapper}>{icon}</span>
          <span className={styles.label}>{activeLabel}</span>
          <span className={styles.chevron}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor">
              <path d="M5 6L0 1L1 0L5 4L9 0L10 1L5 6Z" />
            </svg>
          </span>
        </button>
      }
      content={
        <Menu>
          <DeviceMenuItems
            kind={kind}
            activeDeviceId={activeDeviceId}
            onSelect={handleSelect}
            icon={icon}
            placeholder={placeholder}
            closeMenu={() => setIsOpen(false)}
          />
        </Menu>
      }
      isOpen={isOpen}
      onToggle={setIsOpen}
      placement="bottom-start"
    />
  );
};
