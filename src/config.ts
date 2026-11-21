import fs from "fs";
import os from "os";
import path from "path";

export type Config = {
  dbUrl: string;
  currentUserName: string;
};

function getConfigFilePath(): string {
  return path.join(os.homedir(), ".gatorconfig.json");
}

function writeConfig(cfg: Config): void {
  const rawConfig = {
    db_url: cfg.dbUrl,
    current_user_name: cfg.currentUserName,
  };
  fs.writeFileSync(getConfigFilePath(), JSON.stringify(rawConfig), "utf-8");
}

export function setUser(username: string): void {
  const cfg = readConfig();
  cfg.currentUserName = username;
  writeConfig(cfg);
}

export function readConfig(): Config {
  const rawConfig = JSON.parse(
    fs.readFileSync(getConfigFilePath(), "utf-8"),
  ) as unknown;
  return validateConfig(rawConfig);
}

function validateConfig(rawConfig: unknown): Config {
  if (rawConfig === null || typeof rawConfig !== "object") {
    throw new Error("invalid config: not an object");
  }

  const obj = rawConfig as Record<string, unknown>;

  if (typeof obj.db_url !== "string") {
    throw new Error("invalid config: db_url must be a string");
  }

  return {
    dbUrl: obj.db_url,
    currentUserName:
      typeof obj.current_user_name === "string" ? obj.current_user_name : "",
  };
}
