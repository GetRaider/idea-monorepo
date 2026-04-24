import { Link } from "./links/entities/link.entity.ts";

import { CreateLinkDto } from "./links/dto/create-link.dto.ts";
import { UpdateLinkDto } from "./links/dto/update-link.dto.ts";

export { HttpClient, httpClient } from "./helpers/http-client.helper.ts";
export type {
  IBaseRequest,
  IHttpResponse,
  IHttpRequest,
} from "./helpers/http-client.helper.ts";

export const links = {
  dto: {
    CreateLinkDto,
    UpdateLinkDto,
  },
  entities: {
    Link,
  },
};

// Note: HttpExceptionFilter and propertyHelper are server-side only
// They should not be imported in browser/Next.js contexts
// Import them directly from their files in NestJS applications
