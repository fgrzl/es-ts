import { defineEvent, DomainEvent } from "../../src/domain-event";

export interface CatAdopted extends DomainEvent {}

export const catAdopted = defineEvent<{}, CatAdopted>("cats", "cat.adopted");
