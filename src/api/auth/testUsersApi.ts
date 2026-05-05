// TODO: remove — temporary helper for layout stress-testing

import { userLogin, userSignUp } from "@/api/auth/api.ts";
import { TestUserCredential } from "@/config/testUsers.ts";
import { IUser } from "@/types/user.types.ts";

/**
 * Tries to sign up a test user. If the account already exists the request
 * will fail, so we fall back to a regular login to retrieve the IUser object.
 *
 * Neither token returned by these calls is stored — we only need the user.id
 * to add the player to the game and populate usersStore.
 */
export const registerOrLoginTestUser = async (
  credential: TestUserCredential
): Promise<IUser> => {
  try {
    const res = await userSignUp({
      login: credential.login,
      password: credential.password,
    });

    return (res.data as { user: IUser }).user;
  } catch {
    const res = await userLogin({
      login: credential.login,
      password: credential.password,
    });

    return (res.data as { user: IUser }).user;
  }
};

