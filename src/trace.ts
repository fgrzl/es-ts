import { Context } from "./context";

export function getCorrelationId(_context?: Context): string {
  return "";
}

export function getCausationId(_context?: Context): string {
  return "";
}

export function contextWithTracing(
  _context: Context,
  _correlationId: string,
  _causationId: string,
): Context {
  return _context;
}
