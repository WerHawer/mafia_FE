import { useMutation } from "@tanstack/react-query";

import { usersStore } from "@/store/usersStore.ts";

import { updateAvatar } from "./api.ts";

export const useUpdateAvatarMutation = () => {
  const { setMyUser, me } = usersStore;

  return useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) =>
      updateAvatar(userId, file),
    onSuccess: ({ user }) => {
      // Merge with current user to preserve all fields
      if (me) {
        setMyUser({ ...me, avatar: user.avatar });
      }
    },
  });
};

