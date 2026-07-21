import { VocabularyController } from "@/server/controllers/vocabulary.controller";

const controller = new VocabularyController();

export const GET = controller.list;
export const POST = controller.save;

