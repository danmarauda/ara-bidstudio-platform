import { defineSchema } from "convex/server";
import documents from "./documents/schema";
import annotations from "./annotations/schema";
import corpuses from "./corpuses/schema";
import auth from "./auth/schema";

// Combine all module schemas into one
export default defineSchema({
  ...documents.tables,
  ...annotations.tables,
  ...corpuses.tables,
  ...auth.tables,
});