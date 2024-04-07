import { getAllPublicMessages, getRoomMessages } from "./api.ts";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../apiConstants.ts";
import { useEffect } from "react";
import { messagesStore } from "../../store/messagesStore.ts";

export const useGetMessagesQuery = (id?: string) => {
  return useQuery({
    queryKey: [queryKeys.messages, id ?? "all"],
    queryFn: () => (id ? getRoomMessages(id) : getAllPublicMessages()),
    select: ({ data }) => data,
  });
};

export const useGetMessagesQueryWithStore = (id?: string) => {
  const { setMessages } = messagesStore;

  const { data, ...rest } = useGetMessagesQuery(id);

  useEffect(() => {
    if (!data) return;

    setMessages(data);
  }, [data, setMessages]);

  return { data, ...rest };
};
