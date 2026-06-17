import { NextResponse } from "next/server";

import { getAccessByAuth, requireNonAnonymous } from "@/auth/guards";
import {
  CreateFocusStateDto,
  FocusStateResponseDto,
  UpdateFocusStateDto,
} from "@/db/dtos";
import { apiServices } from "@/server/services/api";

import { BaseController } from "./base.controller";

export class FocusController extends BaseController {
  getState = this.initRoute({
    responseDto: FocusStateResponseDto,
    handler: async () => {
      const auth = await requireNonAnonymous();
      const access = getAccessByAuth(auth);
      const state = await apiServices.focus.getState(access);
      return state ?? { sessions: [], backlog: [] };
    },
  });

  createState = this.initRoute({
    bodyDto: CreateFocusStateDto,
    responseDto: FocusStateResponseDto,
    status: 201,
    handler: async ({ body }) => {
      const auth = await requireNonAnonymous();
      const access = getAccessByAuth(auth);
      return apiServices.focus.createState(body, access);
    },
  });

  updateState = this.initRoute({
    bodyDto: UpdateFocusStateDto,
    responseDto: FocusStateResponseDto,
    handler: async ({ body }) => {
      const auth = await requireNonAnonymous();
      const access = getAccessByAuth(auth);
      return apiServices.focus.updateState(body, access);
    },
  });

  deleteState = this.initRoute({
    handler: async () => {
      const auth = await requireNonAnonymous();
      const access = getAccessByAuth(auth);
      await apiServices.focus.deleteState(access);
      return new NextResponse(null, { status: 204 });
    },
  });
}
