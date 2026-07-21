import { DictionaryController } from "@/server/controllers/dictionary.controller";

const controller = new DictionaryController();

export const GET = controller.getDictionary;

