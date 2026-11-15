import { describe, it, expect } from "vitest";
import { parseDiscountConfig } from "./discount-config";

function form(percentage = "10", minimumQuantity = "3") {
  const data = new FormData();
  data.set("title", "Buy 3 save 10%");
  data.set("percentage", percentage);
  data.set("minimumQuantity", minimumQuantity);
  return data;
}
describe("discount input", () => {
  it("accepts a volume discount", () =>
    expect(parseDiscountConfig(form())).toEqual({
      title: "Buy 3 save 10%",
      percentage: 10,
      minimumQuantity: 3,
    }));
  it.each(["0", "101", "NaN", "Infinity"])(
    "rejects unsafe percentage %s",
    (value) => expect(() => parseDiscountConfig(form(value))).toThrow(),
  );
  it.each(["0", "1.5", "-3"])("rejects invalid quantity %s", (value) =>
    expect(() => parseDiscountConfig(form("10", value))).toThrow(),
  );
});
