import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { encodeAppIconPng } from "../src/helpers/icon.helper.ts";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const resourcesDirectory = join(scriptDirectory, "../resources");

mkdirSync(resourcesDirectory, { recursive: true });
writeFileSync(join(resourcesDirectory, "icon.png"), encodeAppIconPng(1024));
