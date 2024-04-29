import { makeAutoObservable, toJS } from "mobx";
import { MessagesStore, messagesStore } from "@/store/messagesStore.ts";
import { ModalStore, modalStore } from "@/store/modalStore.ts";
import { gamesStore, GamesStore } from "@/store/gamesStore.ts";
import { UsersStore, usersStore } from "@/store/usersStore.ts";
import { streamStore, StreamStore } from "@/store/streamsStore.ts";

class RootStore {
  _usersStore: UsersStore;
  _gamesStore: GamesStore;
  _messagesStore: MessagesStore;
  _modalStore: ModalStore;
  _streamsStore: StreamStore;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });

    this._messagesStore = messagesStore;
    this._modalStore = modalStore;
    this._gamesStore = gamesStore;
    this._usersStore = usersStore;
    this._streamsStore = streamStore;
  }

  get usersStore() {
    return this._usersStore;
  }

  get gamesStore() {
    return this._gamesStore;
  }

  get messagesStore() {
    return this._messagesStore;
  }

  get modalStore() {
    return this._modalStore;
  }

  get streamsStore() {
    return this._streamsStore;
  }

  get isIGM() {
    return toJS(this.gamesStore.isUserGM(this.usersStore.myId));
  }

  get isIDead() {
    return toJS(
      this.gamesStore.activeGameKilledPlayers.includes(this.usersStore.myId),
    );
  }

  get isISpeaker() {
    return toJS(this.gamesStore.speaker === this.usersStore.myId);
  }

  get myRole() {
    return toJS(this.gamesStore.getUserRole(this.usersStore.myId));
  }

  get isIWakedUp() {
    return toJS(
      this.gamesStore.gameFlow.wakeUp?.includes(this.usersStore.myId) &&
        !this.isIDead,
    );
  }
}

export const rootStore = new RootStore();
