import { VocabularyItemController } from "@/server/controllers/vocabulary-item.controller";

const controller = new VocabularyItemController();

export const PATCH = controller.patchTranslation;
export const DELETE = controller.delete;

