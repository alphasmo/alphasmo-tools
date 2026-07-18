import {
  AlphasmoAuthError,
  AlphasmoError,
  AlphasmoNotFoundError,
  AlphasmoParseError,
  AlphasmoRateLimitError,
} from "../errors.js";

export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  NOT_FOUND: 2,
  AUTH_ERROR: 3,
  RATE_LIMIT: 4,
  PARSE_ERROR: 5,
} as const;

export function exitCodeForError(error: unknown): number {
  if (error instanceof AlphasmoNotFoundError) return EXIT_CODES.NOT_FOUND;
  if (error instanceof AlphasmoAuthError) return EXIT_CODES.AUTH_ERROR;
  if (error instanceof AlphasmoRateLimitError) return EXIT_CODES.RATE_LIMIT;
  if (error instanceof AlphasmoParseError) return EXIT_CODES.PARSE_ERROR;
  if (error instanceof AlphasmoError) return EXIT_CODES.GENERAL_ERROR;
  return EXIT_CODES.GENERAL_ERROR;
}

export function messageForError(error: unknown): string {
  if (error instanceof AlphasmoAuthError) {
    return `${error.message} Check your key at https://alphasmo.com/en/developer.`;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
