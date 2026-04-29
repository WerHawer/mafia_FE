import { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { Area, Point } from "react-easy-crop";
import { useTranslation } from "react-i18next";
import axios from "axios";

import { useUpdateAvatarMutation } from "@/api/user/useUpdateAvatarMutation.ts";
import { getCroppedImage } from "@/helpers/getCroppedImage.ts";
import { usersStore } from "@/store/usersStore.ts";
import { Button } from "@/UI/Button/Button.tsx";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { UserAvatar } from "@/UI/Avatar/UserAvatar.tsx";
import { Typography } from "@/UI/Typography";

import styles from "./AvatarUpload.module.scss";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FORMATS = "image/jpeg,image/png,image/webp";
const AVATAR_ASPECT_RATIO = 1;
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.05;
const DEFAULT_ROTATION = 0;
const MAX_ROTATION = 360;
const ROTATION_STEP = 1;

export const AvatarUpload = () => {
  const { t } = useTranslation();
  const { me } = usersStore;
  const { mutateAsync: uploadAvatar, isPending } = useUpdateAvatarMutation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [rotation, setRotation] = useState(DEFAULT_ROTATION);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);

    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(t("avatar.errorFileSize"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setZoom(DEFAULT_ZOOM);
      setRotation(DEFAULT_ROTATION);
      setCrop({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);

    // Reset input value so the same file can be re-selected
    e.target.value = "";
  };

  const onSave = async () => {
    if (!imageSrc || !croppedAreaPixels || !me) return;

    setUploadError(null);

    try {
      const croppedBlob = await getCroppedImage(imageSrc, croppedAreaPixels, rotation);
      const croppedFile = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });

      await uploadAvatar({ userId: me.id, file: croppedFile });
      onCancel();
    } catch (error) {
      // Try to extract a meaningful message from the BE response
      const beMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : null;

      setUploadError(beMessage ?? t("avatar.errorUpload"));
    }
  };

  const onCancel = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(DEFAULT_ZOOM);
    setRotation(DEFAULT_ROTATION);
    setCroppedAreaPixels(null);
    setFileError(null);
    setUploadError(null);
  };

  const onTriggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.container}>
      {/* Avatar preview + trigger button */}
      <div className={styles.avatarSection}>
        <button
          className={styles.avatarButton}
          onClick={onTriggerInput}
          aria-label={t("avatar.changeAvatar")}
          tabIndex={0}
        >
          <UserAvatar
            avatar={me?.avatar}
            name={me?.nikName}
            size="lg"
            className={styles.avatarImage}
          />
          <div className={styles.avatarOverlay}>
            <Typography variant="caption" className={styles.avatarOverlayText}>
              {t("avatar.change")}
            </Typography>
          </div>
        </button>

        <div className={styles.avatarInfo}>
          <Typography variant="subtitle" className={styles.userName}>
            {me?.nikName}
          </Typography>
          <Button
            variant={ButtonVariant.Outline}
            onClick={onTriggerInput}
            size={ButtonSize.Small}
          >
            {t("avatar.uploadPhoto")}
          </Button>
        </div>
      </div>

      {fileError && (
        <Typography variant="caption" className={styles.error}>
          {fileError}
        </Typography>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FORMATS}
        onChange={onFileChange}
        className={styles.hiddenInput}
        aria-hidden="true"
      />

      {/* Crop modal */}
      {imageSrc && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <Typography variant="subtitle" className={styles.modalTitle}>
              {t("avatar.cropTitle")}
            </Typography>

            <div className={styles.cropContainer}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={AVATAR_ASPECT_RATIO}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className={styles.controls}>
              <div className={styles.controlRow}>
                <label className={styles.controlLabel} htmlFor="zoom-slider">
                  <Typography variant="caption">{t("avatar.zoom")}</Typography>
                </label>
                <input
                  id="zoom-slider"
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={ZOOM_STEP}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className={styles.slider}
                  aria-label={t("avatar.zoom")}
                />
              </div>

              <div className={styles.controlRow}>
                <label className={styles.controlLabel} htmlFor="rotate-slider">
                  <Typography variant="caption">
                    {t("avatar.rotate")}
                  </Typography>
                </label>
                <input
                  id="rotate-slider"
                  type="range"
                  min={DEFAULT_ROTATION}
                  max={MAX_ROTATION}
                  step={ROTATION_STEP}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className={styles.slider}
                  aria-label={t("avatar.rotate")}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              {uploadError && (
                <Typography variant="caption" className={styles.uploadError}>
                  {uploadError}
                </Typography>
              )}
              <div className={styles.modalButtons}>
                <Button
                  variant={ButtonVariant.Secondary}
                  size={ButtonSize.Small}
                  onClick={onCancel}
                  disabled={isPending}
                >
                  {t("cancel")}
                </Button>
                <Button
                  variant={ButtonVariant.Primary}
                  size={ButtonSize.Small}
                  onClick={onSave}
                  disabled={isPending}
                >
                  {isPending ? t("avatar.uploading") : t("avatar.save")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
