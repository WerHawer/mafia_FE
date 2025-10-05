import { makeAutoObservable, toJS } from "mobx";
import { makePersistable } from "mobx-persist-store";

import { UserId } from "@/types/user.types.ts";

import { initialGameFlow } from "../helpers/createGameObj.ts";
import {
  GameId,
  IGame,
  IGameFlow,
  IGameShort,
  Roles,
} from "../types/game.types.ts";

export class GamesStore {
  _games: IGameShort[] = [];
  _activeGame: IGame | null = null;
  _activeGameId: GameId = "";

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    void makePersistable(this, {
      name: "Users_mobx_gameFlow",
      properties: ["_activeGameId", "_games", "_activeGame"],
      storage: sessionStorage,
    });
  }

  setGames(games: IGameShort[]) {
    this._games = games;
  }

  setActiveGameId(gameId: GameId) {
    this._activeGameId = gameId;
  }

  updateGames(newGame: IGameShort) {
    const isGameExist = this._games.some((game) => game.id === newGame.id);

    if (!isGameExist) {
      this._games = [newGame, ...this._games];

      return;
    }

    this._games = this._games.map((game) =>
      game.id === newGame.id ? newGame : game
    );
  }

  updateGame(game: IGame) {
    this._activeGame = game;
  }

  updateGameFlow(newFlow: Partial<IGameFlow>) {
    const flow = this._activeGame?.gameFlow;

    if (!flow) return;

    this.updateGame({
      ...this._activeGame,
      gameFlow: { ...flow, ...newFlow },
    } as IGame);
  }

  isUserGM(userId?: string) {
    if (!userId) return false;

    return this.activeGameGm === userId;
  }

  get activeGame() {
    return toJS(this._activeGame);
  }

  get activeGameId() {
    return toJS(this._activeGameId);
  }

  get activeGameGm() {
    return this.activeGame?.gm;
  }

  get activeGameOwner() {
    return this.activeGame?.owner;
  }

  get activeGamePlayers() {
    return toJS(this.activeGame?.players) ?? [];
  }

  get activeGamePlayersWithoutGM() {
    return this.activeGamePlayers.filter(
      (player) => player !== this.activeGameGm
    );
  }

  get activeGameKilledPlayers() {
    return toJS(this.gameFlow.killed) ?? [];
  }

  get activeGameAlivePlayers() {
    return this.activeGamePlayersWithoutGM.filter(
      (player) => !this.activeGameKilledPlayers.includes(player)
    );
  }

  get activeGameRoles() {
    const activeGame = this.activeGame;

    if (!activeGame) return null;

    const { mafia, sheriff, citizens, doctor, maniac, prostitute } = activeGame;

    return toJS({
      mafia,
      sheriff,
      citizens,
      doctor,
      maniac,
      prostitute,
      don: mafia?.[0],
    });
  }

  get gameFlow() {
    return toJS(this.activeGame?.gameFlow) ?? initialGameFlow;
  }

  get speaker() {
    return this.gameFlow.speaker;
  }

  get games() {
    return toJS(this._games);
  }

  getUserRole(id: UserId) {
    const roles = this.activeGameRoles;

    if (!roles) return Roles.Unknown;

    if (roles.mafia?.includes(id)) {
      return roles.mafia[0] === id ? Roles.Don : Roles.Mafia;
    }
    if (roles.citizens?.includes(id)) return Roles.Citizen;
    if (roles.sheriff === id) return Roles.Sheriff;
    if (roles.doctor === id) return Roles.Doctor;
    if (roles.maniac === id) return Roles.Maniac;
    if (roles.prostitute === id) return Roles.Prostitute;
    if (this.isUserGM(id)) return Roles.GM;

    return Roles.Unknown;
  }
}

export const gamesStore = new GamesStore();
