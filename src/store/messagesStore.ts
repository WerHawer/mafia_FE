import { flow, sortBy, sortedUniqBy } from "lodash/fp";
import { makeAutoObservable, toJS } from "mobx";

import {
  IMessage,
  IMessageWithLocal,
  MessageTypes,
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
