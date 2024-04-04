import { getAllPublicMessages } from "./api.ts";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../apiConstants.ts";
import { useEffect } from "react";
import { messagesStore } from "../../store/messagesStore.ts";

export const useGetAllMessages = () => {
  const { setPublicMessages } = messagesStore;

  const { data, ...rest } = useQuery({
    queryKey: [queryKeys.messages, "all"],
    queryFn: getAllPublicMessages,
    select: ({ data }) => [...data].reverse(),
  });

  useEffect(() => {
    if (!data) return;

    setPublicMessages(data);
  }, [data, setPublicMessages]);

  return {
    ...rest,
    data,
  };
};
