# Product recommendations

The product template already requests four products in four desktop columns and two mobile columns. The related-products section now draws random, unique in-stock candidates from the first 50 products exposed by the All collection, excluding the current product. Fewer eligible candidates produce fewer cards; zero candidates hides the section. It retains the existing theme stock rule.

When the client's style mapping is approved, populate `custom.related_products` on each source product as a `list.product_reference` metafield. Those references take priority, preserve their order and are not randomized. The same exclusions and display limit apply. Apply the approved list to each product belonging to the relevant style; this code does not infer or invent relationships. No metafield definitions, product data or catalog relationships have been created by this change.

Selection is bounded to 50 candidates to avoid rendering an entire catalog. If the catalog grows beyond that pool, extend candidate sourcing separately rather than assuming all products participate.
