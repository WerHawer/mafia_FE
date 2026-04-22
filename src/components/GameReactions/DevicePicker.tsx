import { CheckOutlined } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import classNames from "classnames";

import { useDeviceList } from "@/hooks/useDeviceList.ts";

import styles from "./DevicePicker.module.scss";

type DevicePickerProps = {
  kind: MediaDeviceKind;
  activeDeviceId: string;
  onSelect: (deviceId: string) => void;
};

/**
 * A small chevron button that opens a Tippy dropdown with all
 * available devices of the given kind. Selecting one calls `onSelect`.
 */
export const DevicePicker = ({
  kind,
  activeDeviceId,
  onSelect,
}: DevicePickerProps) => {
  const devices = useDeviceList(kind);

  if (devices.length <= 1) {
    // Only one device available — no point showing the picker
    return null;
  }

  const label =
    kind === "videoinput"
      ? "Камера"
      : kind === "audioinput"
        ? "Мікрофон"
        : "Аудіовихід";

  return (
    <Tippy
      content={
        <div className={styles.popover}>
          <p className={styles.popoverTitle}>{label}</p>
          {devices.map((d) => {
            const isActive =
              d.deviceId === activeDeviceId ||
              (activeDeviceId === "" && d.deviceId === "default");

            return (
              <button
                key={d.deviceId}
                className={classNames(styles.deviceOption, {
                  [styles.active]: isActive,
                })}
                onClick={() => onSelect(d.deviceId)}
              >
                <CheckOutlined
                  className={classNames(styles.check, {
                    [styles.checkVisible]: isActive,
                  })}
                />
                <span className={styles.deviceLabel}>
                  {d.label || `${label} ${devices.indexOf(d) + 1}`}
                </span>
              </button>
            );
          })}
        </div>
      }
      theme="quality-picker"
      trigger="click"
      interactive
      placement="top-start"
      appendTo={() => document.body}
    >
      <button
        className={styles.chevron}
        aria-label={`Вибрати ${label}`}
        title={`Вибрати ${label}`}
      >
        <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor">
          <path d="M4 0L8 5H0L4 0Z" />
        </svg>
      </button>
    </Tippy>
  );
};

DevicePicker.displayName = "DevicePicker";
