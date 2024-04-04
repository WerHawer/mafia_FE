import { IMessage, IMessageWithLocal, MessageTypes } from "../types/message.ts";
import { makeAutoObservable, toJS } from "mobx";
import { flow, sortBy, sortedUniqBy } from "lodash/fp";

class Messages {
  messages: Record<string, IMessageWithLocal[]> = {};

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setPublicMessages(messages: IMessage[]) {
    this.messages.public = flow([sortBy("createdAt"), sortedUniqBy("id")])([
      ...(this.messages.public ?? []),
      ...messages,
    ]);
  }

  setPrivateMessages(messages: IMessage[], id: string) {
    this.messages[id] = messages;
  }

  setNewLocalMessage(message: IMessage) {
    const key = message.to.type === MessageTypes.All ? "public" : message.to.id;

    this.messages[key] = [...this.messages[key], { ...message, isLocal: true }];
  }

  setNewMessage(message: IMessage) {
    const key = message.to.type === MessageTypes.All ? "public" : message.to.id;
    const messagesNoLocal = this.messages[key]?.filter(
      ({ isLocal }) => !isLocal,
    );

    this.messages[key] = [...messagesNoLocal, message];
  }

  get publicMessages() {
    return toJS(this.messages.public);
  }

  getRoomMessages(id: string) {
    return toJS(this.messages[id]);
  }
}

export const messagesStore = new Messages();
