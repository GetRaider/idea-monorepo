import { SettingsController } from "@/server/controllers/settings.controller";

const controller = new SettingsController();

export const GET = controller.get;
export const PATCH = controller.patch;

