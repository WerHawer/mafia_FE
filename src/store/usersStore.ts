import { makeAutoObservable, toJS } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { IUser } from "../types/user.types.ts";
import { StreamsArr } from "../types/socket.types.ts";

class Users {
  _myUser: IUser | null = null;
  _users: Record<string, IUser> = {};
  _token: string = "";
  _socketConnectedCount: number = 0;
  _userStreams: StreamsArr = [];

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    makePersistable(this, {
      name: "Users_mobx",
      properties: ["_token", "_myUser"],
      storage: sessionStorage,
    });
  }

  setUser = (user: IUser) => {
    this._users[user.id] = user;
  };

  setMyUser = (user: IUser) => {
    this._myUser = user;
    this._users[user.id] = user;
  };

  setToken = (token: string) => {
    this._token = token;
  };

  setSocketConnectedCount = (count: number) => {
    this._socketConnectedCount = count;
  };

  removeToken = () => {
    this._token = "";
  };

  removeUsers = () => {
    this._users = {};
  };

  removeMyUser = () => {
    this._myUser = null;
  };

  logout = () => {
    this.removeToken();
    this.removeMyUser();
    this.removeUsers();
  };

  setUserStreams(streams: StreamsArr) {
    this._userStreams = streams;
  }

  getUser = (id: string) => {
    return toJS(this._users[id]);
  };

  get token() {
    return toJS(this._token);
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

  get userStreams() {
    return toJS(this._userStreams);
  }
}

export const usersStore = new Users();
