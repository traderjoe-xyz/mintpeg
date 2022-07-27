import fs from "fs";
import path from "path";

export const loadLaunchConfig = (filename: string) => {
  const file = path.join(__dirname, `config/${filename}`);
  const launchConfig = JSON.parse(fs.readFileSync(file, "utf8"));
  return launchConfig;
};

export const loadMintConfig = (filename: string) => {
  const file = path.join(__dirname, `config/mint/${filename}`);
  const mintConfig = JSON.parse(fs.readFileSync(file, "utf8"));
  return mintConfig;
};

export const delay = async (seconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};
