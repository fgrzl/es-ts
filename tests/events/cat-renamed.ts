import { defineEvent, DomainEvent } from "../../src/domain-event";

export interface CatRenamed extends DomainEvent {
  name: string;
}

export const catRenamed = defineEvent<{ name: string }, CatRenamed>("cats", "cat.renamed");
