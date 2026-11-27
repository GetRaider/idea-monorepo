import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  CreateCounterSectionBodySchema,
  UpdateCounterSectionBodySchema,
} from "@repo/api/todex";
import type {
  CreateCounterSectionBody,
  UpdateCounterSectionBody,
} from "@repo/api/todex";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { zodPipe } from "../../pipes/zod-validation.pipe";
import { CounterSectionsService } from "./counter-sections.service";

@Controller("counter-sections")
@UseGuards(WorkspaceGuard)
export class CounterSectionsController {
  constructor(private readonly sections: CounterSectionsService) {}

  @Get()
  async list(@Req() request: WorkspaceRequest) {
    return this.sections.list(request.workspaceId);
  }

  @Post()
  async create(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(CreateCounterSectionBodySchema))
    body: CreateCounterSectionBody,
  ) {
    return this.sections.create(request.workspaceId, body);
  }

  @Patch(":id")
  async update(
    @Req() request: WorkspaceRequest,
    @Param("id") sectionId: string,
    @Body(zodPipe(UpdateCounterSectionBodySchema))
    body: UpdateCounterSectionBody,
  ) {
    return this.sections.update(request.workspaceId, sectionId, body);
  }

  @Delete(":id")
  async remove(
    @Req() request: WorkspaceRequest,
    @Param("id") sectionId: string,
  ) {
    return this.sections.remove(request.workspaceId, sectionId);
  }
}
