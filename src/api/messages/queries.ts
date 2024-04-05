import { getAllPublicMessages, getRoomMessages } from "./api.ts";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../apiConstants.ts";
import { useEffect } from "react";
import { messagesStore } from "../../store/messagesStore.ts";

export const useGetAllMessages = () => {
  return useQuery({
    queryKey: [queryKeys.messages, "all"],
    queryFn: getAllPublicMessages,
    select: ({ data }) => [...data].reverse(),
  });
};

export const useGetAllMessagesWithStore = () => {
  const { setMessages } = messagesStore;

  const { data, ...rest } = useGetAllMessages();

  useEffect(() => {
    if (!data) return;

    setMessages(data);
  }, [data, setMessages]);

  return { data, ...rest };
};

export const useGetRoomMessages = (id: string) => {
  return useQuery({
    queryKey: [queryKeys.messages, id],
    queryFn: () => getRoomMessages(id),
    select: ({ data }) => [...data].reverse(),
  });
};

export const useGetRoomMessagesWithStore = (id: string) => {
  const { setMessages } = messagesStore;

  const { data, ...rest } = useGetRoomMessages(id);

  useEffect(() => {
    if (!data) return;

    setMessages(data);
  }, [data, setMessages]);

  return { data, ...rest };
};
