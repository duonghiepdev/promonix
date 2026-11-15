export function parseDiscountConfig(form: FormData) {
  const title = String(form.get("title") ?? "").trim();
  const percentage = Number(form.get("percentage"));
  const minimumQuantity = Number(form.get("minimumQuantity"));
  if (!title || title.length > 100)
    throw new Error("Enter a title of 1–100 characters.");
  if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100)
    throw new Error("Percentage must be greater than 0 and at most 100.");
  if (
    !Number.isSafeInteger(minimumQuantity) ||
    minimumQuantity < 1 ||
    minimumQuantity > 100000
  )
    throw new Error("Minimum quantity must be a positive whole number.");
  return { title, percentage, minimumQuantity };
}
