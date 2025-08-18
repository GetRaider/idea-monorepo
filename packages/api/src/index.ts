import { Link } from './links/entities/link.entity';

import { CreateLinkDto } from './links/dto/create-link.dto';
import { UpdateLinkDto } from './links/dto/update-link.dto';
import { HttpExceptionFilter } from './helpers/httpExceptionFilter.helper';
import { propertyHelper } from './helpers/property.helper';

export { HttpExceptionFilter } from './helpers/httpExceptionFilter.helper';

export const links = {
  dto: {
    CreateLinkDto,
    UpdateLinkDto,
  },
  entities: {
    Link,
  },
};

export const helpers = {
  HttpExceptionFilter,
  propertyHelper,
};
