declare module "*.svg" {
  import type { StaticImageData } from "next/image";
  const asset: StaticImageData;
  export default asset;
}
