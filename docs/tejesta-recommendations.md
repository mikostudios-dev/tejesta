# Product recommendations

Source: Jon's `Web_ You May Also Like.xlsx`, Drive ID `1UhMQh6sZ9XtwY20x4-ikrm3QYUrUvqjd`, read 2026-11-03. The exact 25 model rows are recorded in jon-related-models.json and implemented in snippets/tejesta-related-models.liquid.

The model comes from custom.style_key or a bounded model prefix in the title. Colorways share the model mapping; RX and non-RX products use the same suggestions. For each suggested family, choose an in-stock product, preferring the source product's RX/non-RX type. If that type is unavailable, another available product in the same suggested family is allowed. No product or catalog relationships are written.

Mapped suggestions preserve Jon's order, never shuffle, exclude the current model/product, and appear at most once per family. Shiprock repeats Raoul three times in the source, so it shows only one Raoul. JPG is absent from the current 249-product catalog; suggestions to JPG are omitted, with no invented replacement. Models with no mapping use a generic random fallback marked `data-selection-mode="fallback"`; it is not attributed to Jon. No results hides the section.

The section paginates the All collection up to 250 products. Catalog growth beyond that bound requires revisiting sourcing. Three columns on desktop, two on mobile. Square product artwork is cropped to its central 50% height, preserving its width (25% off the top and bottom), with no source-image edits.
