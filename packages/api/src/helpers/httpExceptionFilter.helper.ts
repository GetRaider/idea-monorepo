import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  LoggerService,
} from '@nestjs/common';
import { Response } from 'express';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch(HttpException)
export class HttpExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  private readonly logger: LoggerService;

  constructor() {
    super();
    this.logger = new Logger(HttpExceptionFilter.name);
  }

  catch(exception: HttpException | Error, host: ArgumentsHost) {
    this.logger.error('Exception', exception);

    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let exceptionDetails = null;

    switch (true) {
      case exception instanceof HttpException:
        status = exception.getStatus();
        exceptionDetails = {
          status,
          message: exception.message,
        };
        break;
      case exception instanceof Error:
        exceptionDetails = {
          status,
          message: exception.message,
        };
        break;
      default:
        exceptionDetails = { status, message: 'Error' };
    }
    response.status(status).json(exceptionDetails);
  }
}
