import {
  SoundOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { useSpeakerControl } from "@/hooks/useSpeakerControl.ts";
import { IconButton } from "@/UI/IconButton";
import { Typography } from "@/UI/Typography";

import styles from "./SpeakerBlock.module.scss";

export const SpeakerBlock = observer(() => {
  const { t } = useTranslation();
  const {
    speakerName,
    hasSpeaker,
    isVote,
    onStartSpeeches,
    onNextSpeaker,
    onPreviousSpeaker,
    onStopSpeeches,
  } = useSpeakerControl();

  if (isVote) return null;

  const onToggleSpeeches = () => {
    if (hasSpeaker) {
      onStopSpeeches();
    } else {
      onStartSpeeches();
    }
  };

  return (
    <div className={styles.speakerBlockContainer}>
      <Typography variant="body" className={styles.label}>
        {t("speaker.speaker")}:
      </Typography>

      <div className={styles.controlsContainer}>
        <IconButton
          icon={<StepBackwardOutlined />}
          onClick={onPreviousSpeaker}
          disabled={!hasSpeaker}
          ariaLabel={t("speaker.previousSpeaker")}
        />

        <IconButton
          icon={hasSpeaker ? <StopOutlined /> : <SoundOutlined />}
          onClick={onToggleSpeeches}
          ariaLabel={
            hasSpeaker ? t("speaker.stopSpeeches") : t("speaker.startSpeeches")
          }
          active={hasSpeaker}
        />

        <IconButton
          icon={<StepForwardOutlined />}
          onClick={onNextSpeaker}
          disabled={!hasSpeaker}
          ariaLabel={t("speaker.nextSpeaker")}
        />
      </div>

      {speakerName && (
        <Typography variant="body" className={styles.speakerName}>
          {speakerName}
        </Typography>
      )}
    </div>
  );
});
