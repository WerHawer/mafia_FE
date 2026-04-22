import {
  AudioMutedOutlined,
  AudioOutlined,
  SettingOutlined,
  SoundOutlined,
  VideoCameraAddOutlined,
  VideoCameraOutlined,
  LockOutlined,
  MoonOutlined,
} from "@ant-design/icons";
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import Tippy from "@tippyjs/react";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { SoundIndicator } from "@/components/SoundIndicator";
import { useIsSpeaking } from "@/hooks/useIsSpeaking.ts";
import { useMediaControls } from "@/hooks/useMediaControls.ts";
import { rootStore } from "@/store/rootStore.ts";

import { DeviceSelectDropdown } from "./DeviceSelectDropdown";
import styles from "./SelfMediaControlsBar.module.scss";

// Detect browser support for audio output selection
const hasSinkIdSupport =
  typeof HTMLMediaElement !== "undefined" &&
  "setSinkId" in HTMLMediaElement.prototype;

type SelfMediaControlsBarProps = {
  /** Currently selected camera deviceId (from useSelectedDevices) */
  videoDeviceId: string;
  /** Currently selected mic deviceId (from useSelectedDevices) */
  audioInputDeviceId: string;
  /** Currently selected speaker deviceId (from useSelectedDevices) */
  audioOutputDeviceId: string;
  onSelectVideoDevice: (id: string) => void;
  onSelectAudioInputDevice: (id: string) => void;
  onSelectAudioOutputDevice: (id: string) => void;
  onOpenVideoConfig: () => void;
  onOpenAudioConfig: () => void;
};

/**
 * Bottom-bar self-media controls:
 * [🎤 ↑] [📷 ↑] [🔊 ↑]  [⚙️]
 *
 * - Arrow opens a device picker popover
 * - Gear opens the full video/audio settings modal
 */
export const SelfMediaControlsBar = observer(
  ({
    videoDeviceId,
    audioInputDeviceId,
    audioOutputDeviceId,
    onSelectVideoDevice,
    onSelectAudioInputDevice,
    onSelectAudioOutputDevice,
    onOpenVideoConfig,
    onOpenAudioConfig,
  }: SelfMediaControlsBarProps) => {
    const { t } = useTranslation();
    const {
      localParticipant,
      isCameraEnabled,
      isMicrophoneEnabled,
    } = useLocalParticipant();

    const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
    const [isVideoMenuOpen, setIsVideoMenuOpen] = useState(false);

    const isSpeaking = useIsSpeaking(localParticipant);

    const { isIGM, gamesStore, usersStore } = rootStore;
    const { activeGameId } = gamesStore;
    const { myId } = usersStore;

    const { toggleCamera, toggleMicrophone, canControl } = useMediaControls({
      participant: localParticipant,
      isMyStream: true,
      isIGM,
      roomId: activeGameId ?? "",
      requesterId: myId,
    });

    const room = useRoomContext();

    const handleSelectAudioInput = async (id: string) => {
      onSelectAudioInputDevice(id);
      try {
        await room.switchActiveDevice("audioinput", id);
      } catch (e) {
        console.warn("[SelfMediaControlsBar] Failed to switch audio input:", e);
      }
    };

    const handleSelectAudioOutput = async (id: string) => {
      onSelectAudioOutputDevice(id);
      try {
        await room.switchActiveDevice("audiooutput", id);
      } catch (e) {
        console.warn("[SelfMediaControlsBar] Failed to switch audio output:", e);
      }
    };

    // Show SoundIndicator in mic button while speaking (all roles incl GM)
    const showSoundIndicator = isSpeaking;

    const isForceMuted = gamesStore.isUserForceMuted(myId);
    const isNightMuted = gamesStore.gameFlow.isNight && !isIGM;

    let micTooltipText = isMicrophoneEnabled ? t("mediaControls.muteMic") : t("mediaControls.unmuteMic");
    if (isForceMuted) {
      micTooltipText = t("mediaControls.forceMutedBlock");
    } else if (isNightMuted) {
      micTooltipText = t("mediaControls.nightMutedBlock");
    }

    return (
      <div className={styles.selfControls}>
        {/* ── Microphone button + device picker ──────────────────────── */}
        <div className={styles.btnGroup}>
          <Tippy
            content={micTooltipText}
            delay={[500, 0]}
            theme="role-tooltip"
          >
            <button
              className={classNames(styles.controlBtn, styles.controlBtnLeft, {
                [styles.disabled]: !isMicrophoneEnabled || isForceMuted || isNightMuted,
                [styles.speaking]: showSoundIndicator,
              })}
              onClick={() => {
                if (canControl) toggleMicrophone();
              }}
              aria-label={micTooltipText}
            >
              {isForceMuted ? (
                <LockOutlined className={styles.icon} />
              ) : isNightMuted ? (
                <MoonOutlined className={styles.icon} />
              ) : showSoundIndicator ? (
                <SoundIndicator />
              ) : isMicrophoneEnabled ? (
                <AudioOutlined className={styles.icon} />
              ) : (
                <AudioMutedOutlined className={styles.icon} />
              )}
            </button>
          </Tippy>
          <Tippy
            content={
              <div className={styles.meetMenu}>
                <DeviceSelectDropdown
                  kind="audioinput"
                  activeDeviceId={audioInputDeviceId}
                  onSelect={handleSelectAudioInput}
                  icon={<AudioOutlined />}
                  placeholder={t("mediaControls.microphone")}
                />
                {hasSinkIdSupport && (
                  <DeviceSelectDropdown
                    kind="audiooutput"
                    activeDeviceId={audioOutputDeviceId}
                    onSelect={handleSelectAudioOutput}
                    icon={<SoundOutlined />}
                    placeholder={t("mediaControls.speaker")}
                  />
                )}
                <button
                  className={styles.meetSettingsBtn}
                  onClick={() => {
                    setIsAudioMenuOpen(false);
                    onOpenAudioConfig();
                  }}
                  aria-label={t("gmMenu.audioSettings")}
                  title={t("gmMenu.audioSettings")}
                >
                  <SettingOutlined />
                </button>
              </div>
            }
            visible={isAudioMenuOpen}
            onClickOutside={() => setIsAudioMenuOpen(false)}
            interactive
            arrow={true}
            offset={[0, 10]}
            placement="top"
            appendTo={() => document.body}
            maxWidth="none"
          >
            <button
              className={classNames(styles.chevron, { [styles.chevronActive]: isAudioMenuOpen })}
              aria-label={t("mediaControls.audioMenu")}
              onClick={() => setIsAudioMenuOpen(!isAudioMenuOpen)}
            >
              <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor">
                <path d="M4 0L8 5H0L4 0Z" />
              </svg>
            </button>
          </Tippy>
        </div>

        {/* ── Camera button + Google Meet style popover ───────────────── */}
        <div className={styles.btnGroup}>
          <Tippy
            content={isCameraEnabled ? t("mediaControls.disableCam") : t("mediaControls.enableCam")}
            delay={[500, 0]}
            theme="role-tooltip"
          >
            <button
              className={classNames(styles.controlBtn, styles.controlBtnLeft, {
                [styles.disabled]: !isCameraEnabled,
              })}
              onClick={() => {
                if (canControl) toggleCamera();
              }}
              aria-label={
                isCameraEnabled ? t("mediaControls.disableCam") : t("mediaControls.enableCam")
              }
            >
              {isCameraEnabled ? (
                <VideoCameraOutlined className={styles.icon} />
              ) : (
                <VideoCameraAddOutlined className={styles.icon} />
              )}
            </button>
          </Tippy>
          <Tippy
            content={
              <div className={styles.meetMenu}>
                <DeviceSelectDropdown
                  kind="videoinput"
                  activeDeviceId={videoDeviceId}
                  onSelect={onSelectVideoDevice}
                  icon={<VideoCameraOutlined />}
                  placeholder={t("mediaControls.camera")}
                />
                <button
                  className={styles.meetSettingsBtn}
                  onClick={() => {
                    setIsVideoMenuOpen(false);
                    onOpenVideoConfig();
                  }}
                  aria-label={t("gmMenu.videoSettings")}
                  title={t("gmMenu.videoSettings")}
                >
                  <SettingOutlined />
                </button>
              </div>
            }
            visible={isVideoMenuOpen}
            onClickOutside={() => setIsVideoMenuOpen(false)}
            interactive
            arrow={true}
            offset={[0, 10]}
            placement="top"
            appendTo={() => document.body}
            maxWidth="none"
          >
            <button
              className={classNames(styles.chevron, { [styles.chevronActive]: isVideoMenuOpen })}
              aria-label={t("mediaControls.videoMenu")}
              onClick={() => setIsVideoMenuOpen(!isVideoMenuOpen)}
            >
              <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor">
                <path d="M4 0L8 5H0L4 0Z" />
              </svg>
            </button>
          </Tippy>
        </div>
      </div>
    );
  }
);

SelfMediaControlsBar.displayName = "SelfMediaControlsBar";
