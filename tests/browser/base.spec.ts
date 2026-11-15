import { test, expect } from "@playwright/test";
test("landing page renders and database is connected", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Promonix Discounts" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  const health = await request.get("/health");
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({ status: "ok", database: "connected" });
  expect(errors).toEqual([]);
});
test("unsigned webhook cannot be accepted", async ({ request }) => {
  const response = await request.post("/webhooks/app/uninstalled", {
    data: {},
  });
  expect(response.status()).toBe(400);
});
