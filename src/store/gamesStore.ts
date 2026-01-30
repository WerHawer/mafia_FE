import { makeAutoObservable, toJS } from "mobx";
import { makePersistable } from "mobx-persist-store";

import { UserId } from "@/types/user.types.ts";

import { initialGameFlow } from "../helpers/createGameObj.ts";
import {
  IGame,
  IGameFlow,
  IGameShort,
  NightRoles,
  Roles,
} from "../types/game.types.ts";

export class GamesStore {
  _games: IGameShort[] = [];
  _activeGame: IGame | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    void makePersistable(this, {
      name: "Users_mobx_gameFlow",
      properties: ["_games", "_activeGame"],
      storage: sessionStorage,
    });
  }

  setGames(games: IGameShort[]) {
    this._games = games;
  }

  updateGames(newGame: IGameShort) {
    const isGameExist = this._games.some((game) => game.id === newGame.id);

    if (!isGameExist) {
      this._games = [...this._games, newGame];

      return;
    }

    this._games = this._games.map((game) =>
      game.id === newGame.id ? newGame : game
    );
  }

  updateGame(game: IGame) {
    this._activeGame = game;
  }

  removeActiveGame() {
    this._activeGame = null;
  }

  updateGameFlow(newFlow: Partial<IGameFlow>) {
    const flow = this._activeGame?.gameFlow;

    if (!flow) return;

    this.updateGame({
      ...this._activeGame,
      gameFlow: { ...flow, ...newFlow },
    } as IGame);
  }

  setToProposed(playerId: UserId) {
    const proposed = this._activeGame?.gameFlow?.proposed;

    if (!proposed) return;

    const newProposed = [...proposed, playerId];

    this.updateGameFlow({ proposed: newProposed });
  }

  addVoted({
    targetUserId,
    voterId,
  }: {
    targetUserId: UserId;
    voterId: UserId;
  }) {
    const voted = this._activeGame?.gameFlow?.voted;

    if (!voted) return;

    const newVoted = {
      ...voted,
      [targetUserId]: [...(voted[targetUserId] || []), voterId],
    };

    this.updateGameFlow({ voted: newVoted });
  }

  addShoot({
    targetUserId,
    shooterId,
  }: {
    targetUserId: UserId;
    shooterId: UserId;
  }) {
    const shoot = this._activeGame?.gameFlow?.shoot ?? {};

    const newShoot = {
      ...shoot,
      [targetUserId]: [...(shoot[targetUserId] || []), shooterId],
    };

    this.updateGameFlow({ shoot: newShoot });
  }

  isUserGM(userId?: string) {
    if (!userId) return false;

    return this.activeGameGm === userId;
  }

  get activeGame() {
    return toJS(this._activeGame);
  }

  get activeGameId(): string | undefined {
    return this.activeGame?.id;
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

  get nightRoles(): NightRoles[] {
    const roles = this.activeGameRoles;

    if (!roles) return [];

    const nightRoles = Object.entries(roles)
      .filter(([key, value]) => {
        if (!value || key === Roles.Citizen) return false;

        // If it's Mafia group but we only have 1 (who is also the Don), hide Mafia group option
        if (
          key === Roles.Mafia &&
          Array.isArray(value) &&
          value.length === 1
        ) {
          return false;
        }

        return true;
      })
      .map(([key]) => key);

    return nightRoles as NightRoles[];
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
