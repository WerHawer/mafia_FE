/**
 * Bridges {@link usePublishVideoTrack} (mounted inside `VideoConfig` / `useCustomVideo`)
 * with grid health recovery outside that component tree — without prop drilling.
 */
type RepublishFn = () => void;

let registeredRepublish: RepublishFn | null = null;

export const setVideoRecoveryRepublish = (
  republish: RepublishFn | null
): void => {
  registeredRepublish = republish;
};

export const requestDebouncedVideoRepublish = (): void => {
  registeredRepublish?.();
};
