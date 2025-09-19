import { useMutation } from "@tanstack/react-query";

import { getLiveKitToken, ILiveKitTokenRequest } from "./api";

export const useGetLiveKitTokenMutation = () => {
  return useMutation({
    mutationFn: (params: ILiveKitTokenRequest) => getLiveKitToken(params),
  });
};
