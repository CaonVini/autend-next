type ApplicationErrorParams = {
  code: string;
  cause?: unknown;
  details?: Record<string, unknown>;
  publicMessage: string;
  statusCode: number;
};

export class ApplicationError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly publicMessage: string;
  readonly statusCode: number;

  constructor(params: ApplicationErrorParams) {
    super(params.publicMessage, { cause: params.cause });
    this.code = params.code;
    this.details = params.details;
    this.name = "ApplicationError";
    this.publicMessage = params.publicMessage;
    this.statusCode = params.statusCode;
  }
}

export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}
