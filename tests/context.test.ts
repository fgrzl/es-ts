import { describe, expect, it } from "vitest";
import { createContext, mergeContext } from "../src/context";

describe("Context", () => {
  it("should create a context given initial values", () => {
    const ctx = createContext({ correlationId: "corr-1" });

    expect(ctx).toEqual({ correlationId: "corr-1" });
  });

  it("should merge update values given an existing context when mergeContext is called", () => {
    const base = createContext({ correlationId: "corr-1" });
    const merged = mergeContext(base, { causationId: "cause-1", correlationId: "corr-2" });

    expect(merged).toEqual({ correlationId: "corr-2", causationId: "cause-1" });
  });

  it("should merge into an undefined base context when mergeContext is called", () => {
    const merged = mergeContext(undefined, { correlationId: "corr-1" });

    expect(merged).toEqual({ correlationId: "corr-1" });
  });
});
