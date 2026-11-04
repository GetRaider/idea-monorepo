import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import {
  UpdateUserPreferencesBodySchema,
  type UpdateUserPreferencesBody,
} from "@repo/api/todex";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { zodPipe } from "../../pipes/zod-validation.pipe";
import { PreferencesService } from "./preferences.service";

@Controller("preferences")
@UseGuards(WorkspaceGuard)
export class PreferencesController {
  constructor(private readonly preferences: PreferencesService) {}

  @Get()
  get(@Req() request: WorkspaceRequest) {
    return this.preferences.get(request.userId);
  }

  @Patch()
  update(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(UpdateUserPreferencesBodySchema))
    body: UpdateUserPreferencesBody,
  ) {
    return this.preferences.update(request.userId, body);
  }
}
