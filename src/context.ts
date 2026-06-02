export interface Context {
  correlationId?: string;
  causationId?: string;
  [key: string]: unknown;
}

export function createContext(initialValues: Partial<Context> = {}): Context {
  return { ...initialValues };
}

export function mergeContext(base: Context | undefined, update: Partial<Context> = {}): Context {
  return { ...base, ...update };
}
