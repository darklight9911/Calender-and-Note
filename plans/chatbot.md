> ⚠️ **SUPERSEDED — historical record.** This document specifies an "AI nutritionist
> concierge" for the abandoned **Campus Canteen** concept (allergen filtering, calorie
> budgeting, click-to-cart meal recommendations). **None of it was built.** The project
> pivoted to **StudyMind**, where Gemini instead powers two academic features:
> natural-language calendar scheduling and handwritten canvas-note OCR/summarisation
> (see [`new_plan.md`](new_plan.md) and [`SUBMISSION.md`](SUBMISSION.md)). Kept only as a
> design-history artifact.

---

To ensure your AI concierge feels like an organic, premium layer of a modern food ordering application rather than an isolated, generic chat window, the chatbot agent needs a specific set of tailored features.
Dividing these features into three core pillars—Health & Safety, E-commerce Integration, and Conversational Intelligence—will make the application highly functional and intuitive:
1. Health & Safety Guardrails
These features act as the "AI Nutritionist," translating student profile data into immediate, safe guidelines.
• Zero-Exposure Allergen Filtering: The chatbot dynamically scans the real-time ingredient list of every food item currently in the canteen database. If an item contains an active allergen linked to the student’s profile (e.g., peanuts, dairy, gluten), the bot completely filters it out of recommendations or flags it with high-visibility warning banners.
• Dynamic Calorie & Macro Budgeting: Students can state their fitness goals or input their remaining daily allowance (e.g., "I have 650 calories left for the day"). The bot cross-references this with the exact caloric, protein, carbohydrate, and fat metrics of available food items to suggest single meals or complete combos that fit perfectly into their limits.
• Dietary Lifestyle Enforcement: The bot intelligently understands structural dietary categories like Vegan, Vegetarian, Halal, Keto, or low-sodium without requiring strict database flags for every variation—it infers eligibility directly from raw recipe ingredient texts.
2. Deep E-Commerce Integration
Instead of just printing plain text, these features bridge the gap between the AI engine and your Next.js application state.
• Interactive "Click-to-Cart" Recommendations: When the bot recommends a meal, the backend returns the structured database item IDs. The Next.js frontend catches these and renders miniature, visual food cards right inside the chat bubble, complete with pricing, imagery, and a functioning "Add to Cart" button.
• Budget-Conscious Meal Bundling: Students can ask for economical options (e.g., "Give me a filling lunch combo under $6"). The bot handles the math, aggregating separate menu items (like a main dish, a side, and a drink) to find the best combination matching their wallet constraints.
• Direct Contextual Cart Ingestion: The bot can read what is currently sitting in the student's UI shopping cart. If a student adds a meal that conflicts with an active allergy profile or pushes them way past their daily calorie limits, the chatbot can issue a subtle, proactive checkout alert.
3. Conversational Intelligence & Context Awareness
These features leverage Gemini's advanced reasoning capabilities to handle real-world campus scenarios.
• Live-Inventory Synchronization: The bot never acts on old data. Every time a chat session updates, FastAPI passes the current active canteen inventory array as contextual data. If the kitchen updates an item to "Out of Stock" on their admin dashboard, the chatbot immediately stops recommending it.
• Vague Preference Translation: Students rarely search using clinical terms. The bot can interpret abstract cravings—such as "I want something light that won't make me sleepy for my 2 PM exam," or "I need a quick high-protein snack I can eat on the walk to class"—and pair them with highly accurate menu selections.
• Smart Alternate Substitutions: If a student asks for an item that is out of stock or structurally unsafe for them to eat, the bot won't just say "No." It relies on Gemini's logical reasoning to suggest the closest healthy alternative (e.g., "The grilled chicken bowl is out of stock, but the turkey wrap uses similar lean protein and stays within your 500-calorie window").
How this looks in your code schema
Because you are using Structured Outputs via Pydantic in FastAPI, every single one of these features maps cleanly to data properties your Next.js application can instantly interpret:
{
  "conversational_reply": "I found a great lunch for you! Since you're avoiding gluten, I skipped the pasta specials today.",
  "recommended_items": [
    {
      "item_id": 402,
      "item_name": "Quinoa Salad Bowl",
      "reason_for_recommendation": "Gluten-free, highly filling, and only 420 calories."
    }
  ],
  "warnings_or_allergen_alerts": []
}