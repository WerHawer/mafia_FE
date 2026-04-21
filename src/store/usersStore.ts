import { makeAutoObservable, toJS } from "mobx";
import { makePersistable } from "mobx-persist-store";

import { IUser } from "../types/user.types.ts";

export class UsersStore {
  _myUser: IUser | null = null;
  _users: Record<string, IUser> = {};
  _token: string = "";
  _refreshToken: string = "";
  _socketConnectedCount: number = 0;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    makePersistable(this, {
      name: "Users_mobx",
      properties: ["_token", "_refreshToken", "_myUser"],
      storage: localStorage,
    });
  }

  setUser = (user: IUser) => {
    this._users[user.id] = user;
  };

  setUsers = (users: IUser[]) => {
    for (const user of users) {
      if (this._users[user.id]) continue;

      this._users[user.id] = user;
    }
  };

  setMyUser = (user: IUser) => {
    this._myUser = user;
    this._users[user.id] = user;
  };

  setToken = (token: string) => {
    this._token = token;
  };

  setRefreshToken = (token: string) => {
    this._refreshToken = token;
  };

  setSocketConnectedCount = (count: number) => {
    this._socketConnectedCount = count;
  };

  removeToken = () => {
    this._token = "";
  };

  removeRefreshToken = () => {
    this._refreshToken = "";
  };

  removeUsers = () => {
    this._users = {};
  };

  removeMyUser = () => {
    this._myUser = null;
  };

  logout = () => {
    this.removeToken();
    this.removeRefreshToken();
    this.removeMyUser();
    this.removeUsers();
  };

  getUser = (id?: string) => {
    if (!id) return;

    return toJS(this._users[id]);
  };

  getUserName = (id?: string) => {
    if (!id) return;

    return toJS(this._users[id]?.nikName);
  };

  get token() {
    return toJS(this._token);
  }

  get refreshToken() {
    return toJS(this._refreshToken);
  }

  get me() {
    return toJS(this._myUser);
  }

  get myId() {
    return toJS(this._myUser?.id) ?? "";
  }

  get users() {
    return toJS(this._users);
  }

  get socketConnected() {
    return this._socketConnectedCount;
  }
}

export const usersStore = new UsersStore();
