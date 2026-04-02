import {
  SoundOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  StopOutlined,
} from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
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

  const textRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (!textRef.current) return;

    const checkTruncation = () => {
      if (textRef.current) {
        setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
      }
    };

    checkTruncation();
    
    const resizeObserver = new ResizeObserver(checkTruncation);
    resizeObserver.observe(textRef.current);

    return () => resizeObserver.disconnect();
  }, [speakerName]);

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
        <div className={styles.nameWrapper}>
          <Tippy 
            content={speakerName} 
            disabled={!isTruncated} 
            placement="top" 
            theme="role-tooltip"
            animation="scale"
            duration={[200, 150]}
            delay={[500, 0]}
          >
            <Typography variant="body" ref={textRef} className={styles.speakerName}>
              {speakerName}
            </Typography>
          </Tippy>
        </div>
      )}
    </div>
  );
});
