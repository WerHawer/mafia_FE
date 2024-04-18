import { makeAutoObservable, toJS } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { GameId, IGame } from "../types/game.types.ts";
import { initialGameFlow } from "../helpers/createGameObj.ts";

class GamesStore {
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
      game.id === newGame.id ? newGame : game,
    );
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
    return this.activeGame?.players ?? [];
  }

  get activeGamePlayersWithoutGM() {
    return this.activeGamePlayers.filter(
      (player) => player !== this.activeGameGm,
    );
  }

  get activeGameRoles() {
    const activeGame = this.activeGame;

    if (!activeGame) return null;

    const { mafia, sheriff, citizens, doctor, maniac, prostitute } = activeGame;

    return { mafia, sheriff, citizens, doctor, maniac, prostitute };
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
}

export const gamesStore = new GamesStore();
