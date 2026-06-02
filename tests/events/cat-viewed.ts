import { defineEvent, DomainEvent } from "../../src/domain-event";

export interface CatViewed extends DomainEvent {}

export const catViewed = defineEvent<{}, CatViewed>("cats", "cat.viewed");
