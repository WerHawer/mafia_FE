import { makeAutoObservable, toJS } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { GameId, IGame } from "../types/game.types.ts";
import { isDefined } from "../helpers/isDefined.ts";
import { initialGameFlow } from "../helpers/createGameObj.ts";

class GamesStore {
  _games: IGame[] = [];
  _activeGame: GameId = "";

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    makePersistable(this, {
      name: "Users_mobx_gameFlow",
      properties: ["_activeGame"],
      storage: sessionStorage,
    });
  }

  setGames(games: IGame[]) {
    this._games = games;
  }

  setActiveGame(gameId: GameId) {
    this._activeGame = gameId;
  }

  updateGames(newGame: IGame) {
    const isGameExist = this._games.some((game) => game.id === newGame.id);

    if (!isGameExist) {
      this._games = [newGame, ...this._games];

      return;
    }

    this._games = this._games.map((game) =>
      game.id === newGame.id ? newGame : game,
    );
  }

  get activeGame() {
    const active = this._games.find((game) => game.id === this._activeGame);

    return toJS(active);
  }

  get activeGameId() {
    return toJS(this._activeGame);
  }

  get activeGameGm() {
    return this.activeGame?.gm;
  }

  get activeGameOwner() {
    return this.activeGame?.owner;
  }

  get activeGamePlayers() {
    return this.activeGame?.players ?? [];
  }

  get activeGameRoles() {
    const activeGame = this.activeGame;

    if (!activeGame) return null;

    const { mafia, cherif, citizens, doctor, maniac, prostitute } = activeGame;

    return { mafia, cherif, citizens, doctor, maniac, prostitute };
  }

  get gameFlow() {
    return this.activeGame?.gameFlow ?? initialGameFlow;
  }

  get games() {
    return toJS(this._games);
  }
}

export const gamesStore = new GamesStore();
