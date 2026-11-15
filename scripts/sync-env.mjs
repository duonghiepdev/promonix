import { copyFileSync, existsSync } from "node:fs";
if (!existsSync(new URL("../.env", import.meta.url))) {
  throw new Error(
    "Create .env from .env.example and run shopify app env pull --config promonix-discount-dev.",
  );
}
copyFileSync(
  new URL("../.env", import.meta.url),
  new URL("../apps/admin/.env", import.meta.url),
);
console.log("Admin environment synchronized (values hidden).");
