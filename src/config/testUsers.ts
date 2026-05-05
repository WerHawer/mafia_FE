// TODO: remove — temporary config for layout stress-testing with 12 mock players

export type TestUserCredential = {
  login: string;
  password: string;
};

const TEST_PASSWORD = "TestPass123";

export const TEST_USER_CREDENTIALS: TestUserCredential[] = [
  { login: "testplayer01", password: TEST_PASSWORD },
  { login: "testplayer02", password: TEST_PASSWORD },
  { login: "testplayer03", password: TEST_PASSWORD },
  { login: "testplayer04", password: TEST_PASSWORD },
  { login: "testplayer05", password: TEST_PASSWORD },
  { login: "testplayer06", password: TEST_PASSWORD },
  { login: "testplayer07", password: TEST_PASSWORD },
  { login: "testplayer08", password: TEST_PASSWORD },
  { login: "testplayer09", password: TEST_PASSWORD },
  { login: "testplayer10", password: TEST_PASSWORD },
  { login: "testplayer11", password: TEST_PASSWORD },
];


