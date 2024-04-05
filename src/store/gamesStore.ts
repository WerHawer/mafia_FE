import { makeAutoObservable, toJS } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { GameId, IGame, IGameFlow } from "../types/game.types.ts";

const initialGameFlow: IGameFlow = {
  id: "",
  speaker: "",
  speakTimer: 60,
  isStarted: false,
  isFinished: false,
  isNight: false,
};

class GamesStore {
  _games: IGame[] = [];
  _activeGame: GameId | null = null;
  _gameFlow: IGameFlow = initialGameFlow;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    makePersistable(this, {
      name: "Users_mobx_gameFlow",
      properties: ["gameFlow", "_activeGame"],
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

  setGameFlow(gameFlow: Partial<IGameFlow>) {
    this._gameFlow = { ...this._gameFlow, ...gameFlow };
  }

  resetGameFlow() {
    this._gameFlow = initialGameFlow;
  }

  get activeGame() {
    const active = this._games.find((game) => game.id === this._activeGame);

    return toJS(active);
  }

  get gameFlow() {
    return toJS(this._gameFlow);
  }

  get games() {
    return toJS(this._games);
  }
}

export const gamesStore = new GamesStore();
