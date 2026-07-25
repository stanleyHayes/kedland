import {
  BadRequestException,
  HttpStatus,
  Logger,
  NotFoundException,
  UnauthorizedException,
  type ArgumentsHost,
} from "@nestjs/common";

import { AllExceptionsFilter } from "./all-exceptions.filter";

interface Captured {
  status?: number;
  contentType?: string;
  body?: unknown;
}

function hostFor(url = "/api/v1/posts", method = "GET"): { host: ArgumentsHost; captured: Captured } {
  const captured: Captured = {};

  const response = {
    status(code: number) {
      captured.status = code;
      return this;
    },
    type(value: string) {
      captured.contentType = value;
      return this;
    },
    json(payload: unknown) {
      captured.body = payload;
      return this;
    },
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ url, method }),
    }),
  } as unknown as ArgumentsHost;

  return { host, captured };
}

describe("AllExceptionsFilter", () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    // The 5xx path logs a stack; keep test output readable.
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("serves problem+json", () => {
    const { host, captured } = hostFor();
    filter.catch(new NotFoundException("No such post"), host);

    expect(captured.contentType).toBe("application/problem+json");
  });

  it("preserves the status of an HttpException", () => {
    const { host, captured } = hostFor();
    filter.catch(new UnauthorizedException(), host);

    expect(captured.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it("carries the request path as the problem instance", () => {
    const { host, captured } = hostFor("/api/v1/posts/hello-world");
    filter.catch(new NotFoundException("No such post"), host);

    expect(captured.body).toMatchObject({ instance: "/api/v1/posts/hello-world" });
  });

  it("turns the exception name into a readable title", () => {
    const { host, captured } = hostFor();
    filter.catch(new NotFoundException(), host);

    expect(captured.body).toMatchObject({ title: "Not Found" });
  });

  it("groups validation messages by field so the form can attach them", () => {
    const { host, captured } = hostFor("/api/v1/enquiries", "POST");
    filter.catch(
      new BadRequestException({
        message: ["email must be an email", "email should not be empty", "name should not be empty"],
      }),
      host,
    );

    expect(captured.body).toMatchObject({
      detail: "Validation failed",
      errors: {
        email: ["email must be an email", "email should not be empty"],
        name: ["name should not be empty"],
      },
    });
  });

  it("files an unattributable validation message under _", () => {
    const { host, captured } = hostFor();
    filter.catch(new BadRequestException({ message: ["Something is wrong"] }), host);

    expect(captured.body).toMatchObject({ errors: { _: ["Something is wrong"] } });
  });

  it("passes through a pre-built field error map", () => {
    const { host, captured } = hostFor();
    filter.catch(new BadRequestException({ errors: { slug: ["already in use"] } }), host);

    expect(captured.body).toMatchObject({ errors: { slug: ["already in use"] } });
  });

  it("reports an unknown error as a bare 500", () => {
    const { host, captured } = hostFor();
    filter.catch(new Error("connect ECONNREFUSED mongodb://user:hunter2@cluster"), host);

    expect(captured.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(captured.body).toEqual({
      type: "about:blank",
      title: "Internal Server Error",
      status: 500,
      instance: "/api/v1/posts",
    });
  });

  it("never leaks an internal error message to the client", () => {
    const { host, captured } = hostFor();
    filter.catch(new Error("mongodb://admin:hunter2@cluster.example"), host);

    expect(JSON.stringify(captured.body)).not.toMatch(/hunter2/);
  });

  it("logs the stack of an unexpected error so it is not lost", () => {
    const spy = jest.spyOn(Logger.prototype, "error");
    const { host } = hostFor();
    filter.catch(new Error("boom"), host);

    expect(spy).toHaveBeenCalled();
  });

  it("does not log 4xx responses as server errors", () => {
    const spy = jest.spyOn(Logger.prototype, "error");
    const { host } = hostFor();
    filter.catch(new NotFoundException(), host);

    expect(spy).not.toHaveBeenCalled();
  });

  it("handles a string exception payload as the detail", () => {
    const { host, captured } = hostFor();
    filter.catch(new NotFoundException("Plain string reason"), host);

    expect(captured.body).toMatchObject({ detail: "Plain string reason" });
  });
});
