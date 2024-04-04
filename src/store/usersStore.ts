import { IUser } from "../types/user.ts";
import { makeAutoObservable, toJS } from "mobx";
import { makePersistable } from "mobx-persist-store";

class Users {
  myUser: IUser | null = null;
  users: Record<string, IUser> = {};
  token: string = "";

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    makePersistable(this, {
      name: "Users_mobx",
      properties: ["token", "myUser"],
      storage: sessionStorage,
    });
  }

  setUser(user: IUser) {
    this.users[user.id] = user;
  }

  setMyUser(user: IUser) {
    this.myUser = user;
  }

  setToken(token: string) {
    this.token = token;
  }

  removeToken() {
    this.token = "";
  }

  removeUsers() {
    this.users = {};
  }

  removeMyUser() {
    this.myUser = null;
  }

  logout() {
    this.removeUsers();
    this.removeToken();
    this.removeMyUser();
  }

  get me() {
    return toJS(this.myUser);
  }

  get myId() {
    return this.myUser?.id;
  }

  get allUsers() {
    return toJS(this.users);
  }

  getUser(id: string) {
    return this.users[id];
  }
}

export const usersStore = new Users();
