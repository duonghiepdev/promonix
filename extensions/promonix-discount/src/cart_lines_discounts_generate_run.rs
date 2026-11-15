use super::schema;
use serde::Deserialize;
use shopify_function::prelude::*;
use shopify_function::Result;
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Config {
    percentage: f64,
    minimum_quantity: i64,
}
fn parse_config(raw: &str) -> Option<Config> {
    let c: Config = serde_json::from_str(raw).ok()?;
    if !c.percentage.is_finite()
        || c.percentage <= 0.0
        || c.percentage > 100.0
        || c.minimum_quantity < 1
        || c.minimum_quantity > 100000
    {
        return None;
    }
    Some(c)
}
#[shopify_function]
fn cart_lines_discounts_generate_run(
    input: schema::cart_lines_discounts_generate_run::Input,
) -> Result<schema::CartLinesDiscountsGenerateRunResult> {
    let empty = || schema::CartLinesDiscountsGenerateRunResult { operations: vec![] };
    if !input
        .discount()
        .discount_classes()
        .contains(&schema::DiscountClass::Product)
    {
        return Ok(empty());
    }
    let config = input
        .discount()
        .metafield()
        .and_then(|m| parse_config(m.value()));
    let Some(config) = config else {
        return Ok(empty());
    };
    let quantity: i64 = input
        .cart()
        .lines()
        .iter()
        .map(|line| i64::from(*line.quantity()))
        .sum();
    if quantity < config.minimum_quantity {
        return Ok(empty());
    }
    let targets = input
        .cart()
        .lines()
        .iter()
        .map(|line| {
            schema::ProductDiscountCandidateTarget::CartLine(schema::CartLineTarget {
                id: line.id().clone(),
                quantity: None,
            })
        })
        .collect::<Vec<_>>();
    if targets.is_empty() {
        return Ok(empty());
    }
    Ok(schema::CartLinesDiscountsGenerateRunResult {
        operations: vec![schema::CartOperation::ProductDiscountsAdd(
            schema::ProductDiscountsAddOperation {
                selection_strategy: schema::ProductDiscountSelectionStrategy::First,
                candidates: vec![schema::ProductDiscountCandidate {
                    targets,
                    message: Some(format!("{}% volume discount", config.percentage)),
                    value: schema::ProductDiscountCandidateValue::Percentage(schema::Percentage {
                        value: Decimal(config.percentage),
                    }),
                    associated_discount_code: None,
                    prerequisites: None,
                }],
            },
        )],
    })
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn valid_config() {
        assert!(parse_config(r#"{"percentage":10,"minimumQuantity":3}"#).is_some());
    }
    #[test]
    fn unsafe_configs() {
        for raw in [
            r#"{"percentage":101,"minimumQuantity":3}"#,
            r#"{"percentage":10,"minimumQuantity":0}"#,
            r#"{}"#,
            "invalid",
        ] {
            assert!(parse_config(raw).is_none());
        }
    }
}
