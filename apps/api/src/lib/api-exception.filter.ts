import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import type { ApiErrorBody } from "@kotzoeker/shared";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const http =
      exception instanceof HttpException
        ? exception
        : new InternalServerErrorException("Er ging iets mis.");
    const status = http.getStatus();
    const exceptionResponse = http.getResponse();

    const body: ApiErrorBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: http.message,
      details: null,
    };

    if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
      if (
        "message" in exceptionResponse &&
        typeof exceptionResponse.message === "string"
      ) {
        body.message = exceptionResponse.message;
      }
      if (
        "details" in exceptionResponse &&
        typeof exceptionResponse.details === "object"
      ) {
        body.details = exceptionResponse.details as ApiErrorBody["details"];
      }
    }

    if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
      body.message = "Het bestand is te groot (maximaal 5 MB).";
    }

    if (status >= 500) {
      const original = exception instanceof Error ? exception : http;
      this.logger.error(original.message, original.stack);
    }
    host.switchToHttp().getResponse<Response>().status(status).json(body);
  }
}
