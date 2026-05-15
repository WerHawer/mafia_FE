import { flow, sortBy, sortedUniqBy } from "lodash/fp";
import { makeAutoObservable, toJS } from "mobx";

import {
  IMessage,
  IMessageWithLocal,
  MessageTypes,
  ReactionMap,
} from "../types/message.types.ts";

const PUBLIC = "public";

export class MessagesStore {
  messages: Record<string, IMessageWithLocal[]> = {};

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setMessages(messages: IMessage[]) {
    if (!messages.length) return;

    const key =
      messages[0].to.type === MessageTypes.All ? PUBLIC : messages[0].to.id;

    this.messages[key] = flow([sortBy("createdAt"), sortedUniqBy("id")])([
      ...(this.messages[key] ?? []),
      ...messages,
    ]);
  }

  replaceMessages(messages: IMessage[]) {
    if (!messages.length) return;

    const key =
      messages[0].to.type === MessageTypes.All ? PUBLIC : messages[0].to.id;

    // Fully replace the cache with the new messages sorted by creation time
    this.messages[key] = flow([sortBy("createdAt")])(messages);
  }

  setNewLocalMessage(message: IMessage) {
    const key = message.to.type === MessageTypes.All ? PUBLIC : message.to.id;

    this.messages[key] = [
      ...(this.messages[key] ?? []),
      { ...message, isLocal: true },
    ];
  }

  setNewMessage(message: IMessage) {
    const key = message.to.type === MessageTypes.All ? PUBLIC : message.to.id;
    const messagesNoLocal =
      this.messages[key]?.filter(({ isLocal }) => !isLocal) ?? [];

    this.messages[key] = [...messagesNoLocal, message];
  }

  patchMessageReactions(roomKey: string, messageId: string, reactions: ReactionMap) {
    const list = this.messages[roomKey];
    if (!list) return;
    this.messages[roomKey] = list.map((m) =>
      m.id === messageId ? { ...m, reactions } : m
    );
  }

  toggleReactionLocal(
    roomKey: string,
    messageId: string,
    emojiUnified: string,
    userId: string
  ) {
    const msg = this.messages[roomKey]?.find((m) => m.id === messageId);
    if (!msg) return;

    const reactions = { ...(msg.reactions ?? {}) };
    const existing = reactions[emojiUnified] ?? [];
    const next = existing.includes(userId)
      ? existing.filter((u) => u !== userId)
      : [...existing, userId];

    if (next.length === 0) delete reactions[emojiUnified];
    else reactions[emojiUnified] = next;

    this.patchMessageReactions(roomKey, messageId, reactions);
  }

  get publicMessages() {
    return toJS(this.messages.public);
  }

  get allMessages() {
    return toJS(this.messages);
  }

  getMessages(id: string) {
    return toJS(this.messages[id] ?? []);
  }
}

export const messagesStore = new MessagesStore();
