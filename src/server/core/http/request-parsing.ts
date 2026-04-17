import type { ZodSchema } from "zod";
import { ApplicationError } from "@/src/server/core/errors/application-error";

export async function parseJsonRequest<TSchema extends ZodSchema>(
  request: Request,
  schema: TSchema,
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    throw new ApplicationError({
      cause: error,
      code: "INVALID_JSON_BODY",
      publicMessage: "A requisicao enviada e invalida.",
      statusCode: 400,
    });
  }

  return schema.parse(body);
}
