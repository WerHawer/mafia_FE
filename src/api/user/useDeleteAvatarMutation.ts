import { useMutation } from "@tanstack/react-query";

import { messagesStore } from "@/store/messagesStore.ts";
import { usersStore } from "@/store/usersStore.ts";

import { deleteAvatar } from "./api.ts";

export const useDeleteAvatarMutation = () => {
  const { setMyUser, me } = usersStore;
  const { replaceMessages } = messagesStore;

  return useMutation({
    mutationFn: ({ avatarId }: { avatarId: string }) => deleteAvatar(avatarId),
    onSuccess: ({ user, messages }) => {
      // Merge with current user to preserve all fields
      if (me) {
        setMyUser({ ...me, avatar: user.avatar });
      }

      if (messages && messages.length > 0) {
        replaceMessages(messages);
      }
    },
  });
};

