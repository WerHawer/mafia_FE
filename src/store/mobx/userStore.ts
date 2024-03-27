import { IUser } from "../../types/user.ts";
import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";

class Users {
  users: Record<string, IUser> = {};
  token: string = "";

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    makePersistable(this, {
      name: "Users_mobx",
      properties: ["token", "users"],
      storage: localStorage,
    });
  }

  setUser(user: IUser) {
    this.users[user.id] = user;
  }

  setMyUser(user: IUser) {
    this.users.me = user;
  }

  setToken(token: string) {
    this.token = token;
  }

  removeToken() {
    this.token = "";
  }

  logout() {
    this.token = "";
    this.users = {};
  }

  get me() {
    return this.users.me;
  }

  get myId() {
    return this.users.me?.id;
  }

  getUser(id: string) {
    return this.users[id];
  }
}

export const userStore = new Users();
