import { makeAutoObservable, toJS } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { IUser } from "../types/user.types.ts";

class Users {
  myUser: IUser | null = null;
  users: Record<string, IUser> = {};
  token: string = "";
  socketConnectedCount: number = 0;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    makePersistable(this, {
      name: "Users_mobx",
      properties: ["token", "myUser"],
      storage: sessionStorage,
    });
  }

  setUser = (user: IUser) => {
    this.users[user.id] = user;
  };

  setMyUser = (user: IUser) => {
    this.myUser = user;
    this.users[user.id] = user;
  };

  setToken = (token: string) => {
    this.token = token;
  };

  setSocketConnectedCount = (count: number) => {
    this.socketConnectedCount = count;
  };

  removeToken = () => {
    this.token = "";
  };

  removeUsers = () => {
    this.users = {};
  };

  removeMyUser = () => {
    this.myUser = null;
  };

  logout = () => {
    this.removeToken();
    this.removeMyUser();
    this.removeUsers();
  };

  getUser = (id: string) => {
    return toJS(this.users[id]);
  };

  get me() {
    return toJS(this.myUser);
  }

  get myId() {
    return toJS(this.myUser?.id);
  }

  get allUsers() {
    return toJS(this.users);
  }

  get socketConnected() {
    return this.socketConnectedCount > 0;
  }
}

export const usersStore = new Users();
