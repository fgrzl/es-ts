import { registerEvent } from "../../src/domain-event";
import { catAdopted } from "./cat-adopted";
import { catRenamed } from "./cat-renamed";
import { catViewed } from "./cat-viewed";

export { catAdopted, catRenamed, catViewed };

export function registerEvents(): void {
  registerEvent(catAdopted);
  registerEvent(catRenamed);
  registerEvent(catViewed);
}
