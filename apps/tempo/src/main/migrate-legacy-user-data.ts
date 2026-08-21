import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { app } from "electron";

const LEGACY_USER_DATA_DIR_NAMES = ["focuzer", "Focuzer"] as const;

export function configureTempoUserDataPath(): string {
  app.setName("Tempo");
  const tempoUserDataPath = join(app.getPath("appData"), "Tempo");
  app.setPath("userData", tempoUserDataPath);
  migrateLegacyUserData(tempoUserDataPath);
  return tempoUserDataPath;
}

function migrateLegacyUserData(tempoUserDataPath: string): void {
  mkdirSync(tempoUserDataPath, { recursive: true });

  for (const legacyDirName of LEGACY_USER_DATA_DIR_NAMES) {
    const legacyUserDataPath = join(app.getPath("appData"), legacyDirName);
    if (!existsSync(legacyUserDataPath)) {
      continue;
    }

    for (const entryName of readdirSync(legacyUserDataPath)) {
      const sourcePath = join(legacyUserDataPath, entryName);
      const targetPath = join(tempoUserDataPath, entryName);
      if (existsSync(targetPath)) {
        continue;
      }

      cpSync(sourcePath, targetPath, {
        recursive: statSync(sourcePath).isDirectory(),
      });
    }
  }
}
