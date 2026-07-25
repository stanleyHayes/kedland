import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";

import type { ProblemDetails } from "@kedland/types";
import type { Request, Response } from "express";

/**
 * Widened to `number` on purpose: `ProblemDetails.status` is a plain number, and
 * comparing it against the enum member directly trips no-unsafe-enum-comparison.
 */
const SERVER_ERROR_FLOOR: number = HttpStatus.INTERNAL_SERVER_ERROR;

/**
 * Every failure leaves as RFC 7807 problem+json.
 *
 * One error shape means the dashboard writes one error path, and `errors`
 * carries field-level detail so a validation failure can be attached to the
 * right input instead of shown as a generic banner.
 *
 * Unexpected errors are logged in full and reported as a bare 500 — an
 * exception message can carry a connection string or a stack trace, and neither
 * belongs in a response body.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const problem = this.toProblem(exception, request.url);

    if (problem.status >= SERVER_ERROR_FLOOR) {
      this.logger.error(
        `${request.method} ${request.url} failed`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(problem.status).type("application/problem+json").json(problem);
  }

  private toProblem(exception: unknown, instance: string): ProblemDetails {
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception, instance);
    }

    return {
      type: "about:blank",
      title: "Internal Server Error",
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      instance,
    };
  }

  private fromHttpException(exception: HttpException, instance: string): ProblemDetails {
    const status = exception.getStatus();
    const payload = exception.getResponse();

    const problem: ProblemDetails = {
      type: "about:blank",
      title: exception.name.replace(/Exception$/, "").replace(/([a-z])([A-Z])/g, "$1 $2"),
      status,
      instance,
    };

    if (typeof payload === "string") {
      return { ...problem, detail: payload };
    }

    const body = payload as Record<string, unknown>;

    if (typeof body["message"] === "string") {
      problem.detail = body["message"];
    } else if (Array.isArray(body["message"])) {
      // Nest's ValidationPipe hands back an array of human-readable strings.
      problem.detail = "Validation failed";
      problem.errors = groupValidationMessages(body["message"] as string[]);
    }

    if (isFieldErrorMap(body["errors"])) {
      problem.errors = body["errors"];
    }

    return problem;
  }
}

function isFieldErrorMap(value: unknown): value is Record<string, string[]> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => Array.isArray(v) && v.every((s) => typeof s === "string"))
  );
}

/**
 * class-validator property names: lowerCamelCase, optionally with nested paths
 * (`guardian.email`) or array indices (`levels[0]`).
 *
 * Anchoring on a *lowercase* first letter matters. A looser pattern reads the
 * first word of any sentence as a field name, so "Something is wrong" would be
 * filed under a field called "Something" — and the dashboard would attach that
 * error to an input that does not exist, leaving the real problem invisible.
 */
const FIELD_NAME = /^([a-z]\w*(?:(?:\.\w+)|(?:\[\d+\]))*)\s/;

/**
 * Turns `["email must be an email", "name should not be empty"]` into
 * `{ email: [...], name: [...] }`. Messages that do not name a field land under
 * `_`, which the form renders as a general error rather than a field one.
 */
function groupValidationMessages(messages: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const message of messages) {
    const field = FIELD_NAME.exec(message)?.[1] ?? "_";
    grouped[field] = [...(grouped[field] ?? []), message];
  }

  return grouped;
}
