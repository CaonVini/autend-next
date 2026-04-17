import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { ApplicationError, isApplicationError } from "@/src/server/core/errors/application-error";

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store",
  };
}

function createValidationErrorResponse(error: ZodError) {
  return NextResponse.json(
    {
      error: {
        code: "VALIDATION_ERROR",
        fieldErrors: error.flatten().fieldErrors,
        message: "A requisicao enviada e invalida.",
      },
    },
    {
      headers: noStoreHeaders(),
      status: 400,
    },
  );
}

function createApplicationErrorResponse(error: ApplicationError) {
  const headers = new Headers(noStoreHeaders());

  if (typeof error.details?.retryAfterSeconds === "number") {
    headers.set("Retry-After", String(error.details.retryAfterSeconds));
  }

  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.publicMessage,
      },
    },
    {
      headers,
      status: error.statusCode,
    },
  );
}

export async function withRouteErrorHandling(
  handler: () => Promise<NextResponse>,
) {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ZodError) {
      return createValidationErrorResponse(error);
    }

    if (isApplicationError(error)) {
      return createApplicationErrorResponse(error);
    }

    console.error("Unexpected route handler error", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Nao foi possivel concluir a operacao.",
        },
      },
      {
        headers: noStoreHeaders(),
        status: 500,
      },
    );
  }
}
