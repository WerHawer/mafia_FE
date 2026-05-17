import { useMutation } from "@tanstack/react-query";

import { usersStore } from "@/store/usersStore.ts";

import { updateUserSettings, UpdateUserSettingsPayload } from "./api.ts";

type MutationVars = { userId: string } & UpdateUserSettingsPayload;

export const useUpdateUserSettingsMutation = () => {
  const { me, setMyUser } = usersStore;

  return useMutation({
    mutationFn: ({ userId, ...payload }: MutationVars) =>
      updateUserSettings(userId, payload),
    onSuccess: (updatedUser) => {
      if (me) {
        setMyUser({ ...me, ...updatedUser });
      }
    },
  });
};
