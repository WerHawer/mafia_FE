import {
  SoundOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { Timer } from "@/components/SpeakerTimer/Timer.tsx";
import { useSpeakerControl } from "@/hooks/useSpeakerControl.ts";

import styles from "./SpeakerBlock.module.scss";

export const SpeakerBlock = observer(() => {
  const { t } = useTranslation();
  const {
    speakerName,
    hasSpeaker,
    isVote,
    speaker,
    onStartSpeeches,
    onNextSpeaker,
    onPreviousSpeaker,
  } = useSpeakerControl();

  if (isVote) return null;

  return (
    <div className={styles.speakerBlockContainer}>
      <div className={styles.controlsContainer}>
        {hasSpeaker && (
          <StepBackwardOutlined
            onClick={onPreviousSpeaker}
            className={styles.controlIcon}
            title={t("speaker.previousSpeaker")}
          />
        )}

        <SoundOutlined
          onClick={onStartSpeeches}
          className={styles.controlIcon}
          title={t("speaker.startSpeeches")}
        />

        {hasSpeaker && (
          <StepForwardOutlined
            onClick={onNextSpeaker}
            className={styles.controlIcon}
            title={t("speaker.nextSpeaker")}
          />
        )}
      </div>

      {speakerName && (
        <p className={styles.speakerInfo}>
          {t("speaker.speaker")}: {speakerName} -{" "}
          <Timer resetTrigger={speaker} />
        </p>
      )}
    </div>
  );
});
