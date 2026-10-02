import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from "@nestjs/common";
import { DrizzleQueryError } from "drizzle-orm";
import { ApiExceptionFilter } from "../lib/api-exception.filter";

@Catch(DrizzleQueryError)
export class DrizzleQueryErrorFilter implements ExceptionFilter {
  private readonly http = new ApiExceptionFilter();

  catch(error: DrizzleQueryError, host: ArgumentsHost) {
    const cause = error.cause as
      { code?: string; constraint_name?: string } | undefined;

    switch (cause?.code) {
      case "23505": // unique_violation
        if (cause.constraint_name === "users_email_unique") {
          return this.http.catch(
            new ConflictException(
              "Er bestaat al een account met dit e-mailadres.",
            ),
            host,
          );
        }
        return this.http.catch(new ConflictException("Dit bestaat al."), host);
      case "23503": // foreign_key_violation
        return this.http.catch(
          new NotFoundException("Een gekoppeld item bestaat niet."),
          host,
        );
    }

    return this.http.catch(error, host);
  }
}
