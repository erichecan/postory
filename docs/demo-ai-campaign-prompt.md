# Demo AI campaign prompt rules

The demo image endpoint accepts structured values (`industry`, `campaignDirection`, and `ratio`) rather than a prompt written by the browser. The server validates the direction against the selected industry's recipe and assembles the final prompt in `src/lib/ai/demo-campaign-prompt.ts`.

## Prompt formula

1. Global task: make a polished marketing visual by editing the uploaded source photo.
2. Industry profile: preserve the industry's defining subject and describe safe photo enhancements and allowed background changes.
3. Campaign recipe: composition, focal hierarchy, negative space, art direction, color/light, and photo treatment.
4. Ratio rule: compose for the requested canvas and protect the product in a crop-safe area.
5. Shared output rules: leave typography to the code renderer; prohibit generated copy, facts, prices, logos, watermarks, and UI.

The generated image is the visual/photo layer. The demo's existing React template renderer remains responsible for user-entered title, copy, appointment details, and watermark. The requested direction is therefore not accepted as arbitrary prompt text from the client.

## Current recipe coverage

- Sushi: `new-arrival`, `lunch-set`, `healthy-light`, `limited-offer`, `seafood-feature`, `premium-signature`, `signature-platter`, and `date-night`.
- Nails: `new-arrival`, `seasonal-style`, `appointment`, and `holiday-promo`.

Each industry profile is independent. Add a new industry by defining its subject-preservation policy, permitted photo edits, direction recipes, and ratio rules in the prompt builder, then expose matching direction IDs in the demo UI. Do not place industry-specific fidelity rules in the generic route handler.

## Image dimensions

Prompt ratio instructions control composition, not pixel dimensions. `src/lib/ai/openai-image-provider.ts` currently requests 1024×1024 for square, 1024×1280 for portrait 4:5, and 864×1536 for story 9:16. The export renderer separately produces the selected platform output dimensions.
