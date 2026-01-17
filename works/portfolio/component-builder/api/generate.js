import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const { 
      prompt,
      difficulty, 
      variationCount = 3,
      brand = {} // { primary, secondary, font, radius }
    } = req.body;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build the smart system prompt
    const systemPrompt = `
You are a UNIVERSAL UI COMPONENT GENERATION ENGINE.

Your job is to generate:
1. MULTIPLE VARIATIONS of a requested UI component.
2. Each variation should include both LIGHT and DARK theme versions.
3. Apply BRAND TOKENS if provided.

OUTPUT MUST ALWAYS FOLLOW THIS EXACT STRICT JSON FORMAT:

{
  "brandTokens": {
    "primary": "",
    "secondary": "",
    "font": "",
    "radius": ""
  },
  "variations": [
    {
      "id": 1,
      "light": { "html": "", "css": "", "js": "" },
      "dark": { "html": "", "css": "", "js": "" },
      "mockData": {},
      "notes": ""
    }
  ]
}

RULES:
- DO NOT add Markdown formatting.
- DO NOT escape characters unnecessarily.
- ONLY return valid JSON.
- CSS must use CSS variables: --primary, --secondary, --radius, --font.
- Implement brand tokens into CSS variables.
- DARK MODE must use the same structure but adjusted colors.
- Keep designs clean, modern, and production-ready.
`;

    const brandInfo = `
BRAND TOKENS:
Primary: ${brand.primary || "auto"}
Secondary: ${brand.secondary || "auto"}
Font: ${brand.font || "Inter"}
Radius: ${brand.radius || "8px"}
`;

    const userPrompt = `
Generate ${variationCount} unique variations of this component:

"${prompt}"

Difficulty: ${difficulty}
${brandInfo}

Return only JSON.
`;

    // Call OpenAI
    const completion = await client.responses.create({
      model: "gpt-4.1",
      reasoning: { effort: "medium" },
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_output_tokens: 6000
    });

    // Extract the response text
    const aiText = completion.output_text.trim();

    // Attempt to parse JSON
    let parsed;
    try {
      parsed = JSON.parse(aiText);
    } catch (err) {
      // If JSON parsing fails, return raw text to help debug
      return res.status(200).json({
        success: false,
        error: "Invalid JSON from AI",
        raw: aiText
      });
    }

    // Return structured output
    res.status(200).json({
      success: true,
      ...parsed
    });

  } catch (error) {
    console.error("Error in generate API:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
