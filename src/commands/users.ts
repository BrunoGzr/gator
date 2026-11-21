import { readConfig, setUser } from "../config.js";
import {
  createUser,
  deleteAllUsers,
  getUser,
  getUsers,
} from "../lib/db/queries/users.js";

export async function handlerLogin(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("a username is required");
  }

  const username = args[0];
  const user = await getUser(username);

  if (!user) {
    throw new Error(`user ${username} does not exist`);
  }

  setUser(user.name);
  console.log(`User set to ${user.name}`);
}

export async function handlerRegister(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("a username is required");
  }

  const username = args[0];
  const user = await createUser(username);

  if (!user) {
    throw new Error("failed to create user");
  }

  setUser(user.name);
  console.log(`User ${user.name} was created`);
}

export async function handlerReset(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  try {
    await deleteAllUsers();
    console.log("Database reset successful");
  } catch (error) {
    throw new Error("failed to reset database");
  }
}

export async function handlerUsers(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const allUsers = await getUsers();
  const config = readConfig();

  for (const user of allUsers) {
    const current = user.name === config.currentUserName ? " (current)" : "";
    console.log(`* ${user.name}${current}`);
  }
}
