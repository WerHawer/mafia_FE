import toast, { ToastOptions } from "react-hot-toast";

import { CustomToast, ToastTone } from "./CustomToast";

export interface ShowToastOptions extends Omit<ToastOptions, "icon"> {
  title?: string;
}

/**
 * Single entry point for all global toasts.
 *
 * Replaces every raw `toast(...)`, `toast.success(...)`, `toast.error(...)`
 * call in the codebase. Pass a tone — the visual treatment (accent color,
 * icon, default title) follows automatically.
 *
 *   showToast("info",    t("vote.toastVoteStarted"));
 *   showToast("gm",      t("gm.youAreNewGM"));
 *   showToast("warning", t("mediaControls.forceMutedToast"));
 *   showToast("success", t("mediaControls.forceUnmutedToast"));
 *   showToast("error",   t("mediaControls.forceMutedBlock"));
 */
export const showToast = (
  tone: ToastTone,
  message: string,
  options: ShowToastOptions = {}
) => {
  const { title, duration = 4000, id, position, ...rest } = options;

  return toast.custom(
    (t) => (
      <CustomToast
        t={t}
        tone={tone}
        title={title}
        message={message}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ),
    { duration, id, position, ...rest }
  );
};
