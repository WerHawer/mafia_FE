import { makeAutoObservable, toJS } from "mobx";
import { makePersistable } from "mobx-persist-store";

import { UserId } from "@/types/user.types.ts";

import { initialGameFlow } from "../helpers/createGameObj.ts";
import { GameId, IGame, IGameFlow, Roles } from "../types/game.types.ts";

export class GamesStore {
  _games: IGame[] = [];
  _activeGameId: GameId = "";

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    makePersistable(this, {
      name: "Users_mobx_gameFlow",
      properties: ["_activeGameId"],
      storage: sessionStorage,
    });
  }

  setGames(games: IGame[]) {
    this._games = games;
  }

  setActiveGame(gameId: GameId) {
    this._activeGameId = gameId;
  }

  updateGames(newGame: IGame) {
    const isGameExist = this._games.some((game) => game.id === newGame.id);

    if (!isGameExist) {
      this._games = [newGame, ...this._games];

      return;
    }

    this._games = this._games.map((game) =>
      game.id === newGame.id ? newGame : game
    );
  }

  updateGameFlow(newFlow: Partial<IGameFlow>) {
    const flow = this.activeGame?.gameFlow;

    if (!flow) return;

    this.updateGames({
      ...this.activeGame,
      gameFlow: { ...flow, ...newFlow },
    });
  }

  isUserGM(userId?: string) {
    if (!userId) return false;

    return this.activeGameGm === userId;
  }

  get activeGame() {
    const active = this._games.find((game) => game.id === this._activeGameId);

    return toJS(active);
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
