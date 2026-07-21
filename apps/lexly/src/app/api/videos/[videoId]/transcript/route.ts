import { TranscriptController } from "@/server/controllers/transcript.controller";

const controller = new TranscriptController();

export const GET = controller.getTranscript;

