import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { parseDiscountConfig } from "../discount-config";
export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`query { shop { name } }`);
  const body = await response.json();
  return { shopName: body.data?.shop.name ?? "Your store" };
}
export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  let rule;
  try {
    rule = parseDiscountConfig(await request.formData());
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Invalid rule",
      success: false,
    };
  }
  const response = await admin.graphql(
    `mutation CreateDiscount($discount: DiscountAutomaticAppInput!) { discountAutomaticAppCreate(automaticAppDiscount: $discount) { automaticAppDiscount { discountId title } userErrors { field message } } }`,
    {
      variables: {
        discount: {
          title: rule.title,
          functionHandle: "promonix-discount",
          discountClasses: ["PRODUCT"],
          startsAt: new Date().toISOString(),
          combinesWith: {
            productDiscounts: false,
            orderDiscounts: false,
            shippingDiscounts: true,
          },
          metafields: [
            {
              namespace: "$app:promonix",
              key: "discount-config",
              type: "json",
              value: JSON.stringify({
                percentage: rule.percentage,
                minimumQuantity: rule.minimumQuantity,
              }),
            },
          ],
        },
      },
    },
  );
  const body = await response.json();
  const result = body.data?.discountAutomaticAppCreate;
  const errors = result?.userErrors ?? [];
  if (errors.length || !result?.automaticAppDiscount)
    return {
      success: false,
      error:
        errors.map((e: { message: string }) => e.message).join("; ") ||
        "Discount could not be created.",
    };
  return { success: true, error: "" };
}
export default function Discounts() {
  const { shopName } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  return (
    <s-page heading="Promonix Discounts">
      <s-section heading={shopName}>
        <s-paragraph>
          Create a volume discount applied automatically at checkout.
        </s-paragraph>
      </s-section>
      {result && (
        <s-banner tone={result.success ? "success" : "critical"}>
          {result.success
            ? "Discount created. Manage or disable it in Shopify Admin > Discounts."
            : result.error}
        </s-banner>
      )}
      <s-section heading="Create a volume discount">
        <Form method="post">
          <div style={{ display: "grid", gap: 16, maxWidth: 520 }}>
            <label>
              Title
              <input
                style={{ display: "block", width: "100%" }}
                name="title"
                defaultValue="Buy 3 save 10%"
                maxLength={100}
                required
              />
            </label>
            <label>
              Discount (%)
              <input
                style={{ display: "block", width: "100%" }}
                name="percentage"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                defaultValue="10"
                required
              />
            </label>
            <label>
              Minimum total quantity
              <input
                style={{ display: "block", width: "100%" }}
                name="minimumQuantity"
                type="number"
                min="1"
                step="1"
                defaultValue="3"
                required
              />
            </label>
            <button type="submit" disabled={navigation.state !== "idle"}>
              {navigation.state !== "idle"
                ? "Creating?"
                : "Create automatic discount"}
            </button>
          </div>
        </Form>
      </s-section>
    </s-page>
  );
}
