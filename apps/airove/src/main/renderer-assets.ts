import { isAbsolute, relative, resolve, sep } from "node:path";

export function rendererAssetPath(value: string, root: string): string | null {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "airove:" ||
      url.hostname !== "app" ||
      url.port ||
      url.username ||
      url.password
    )
      return null;
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.includes("\u0000")) return null;
    const asset = resolve(root, `.${pathname}`);
    const withinRoot = relative(root, asset);
    if (
      withinRoot === ".." ||
      withinRoot.startsWith(`..${sep}`) ||
      isAbsolute(withinRoot)
    )
      return null;
    return asset;
  } catch {
    return null;
  }
}
