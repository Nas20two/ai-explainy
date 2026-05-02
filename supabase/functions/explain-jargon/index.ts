const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jargon } = await req.json();
    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openrouterKey) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openrouterKey}`,
        "HTTP-Referer": "https://ai-explainy.vercel.app",
        "X-Title": "AI Explainy - Jargon Buster",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-v4-flash",
        messages: [
          {
            role: "system",
            content: `You are the AI Jargon Buster! Your job is to explain confusing AI and tech jargon in a way that a 5-year-old would understand.

Rules:
- Use simple, everyday words and fun analogies
- Include relevant emojis throughout your explanation (🤖, 🧠, 🎲, 💡, 🔮, etc.)
- Start with a one-sentence "TL;DR" summary using an emoji
- Then give a more detailed but still simple explanation
- Use analogies kids would understand (toys, games, animals, food, etc.)
- Keep it fun, friendly, and encouraging
- If there are multiple jargon terms, explain each one
- Maximum 200 words
- Format with markdown for readability`,
          },
          {
            role: "user",
            content: `Please explain this AI jargon in simple terms:\n\n"${jargon}"`,
          },
        ],
        stream: true,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Whoa, too many requests! Please wait a moment and try again. 🐢" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("OpenRouter error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Oops! The AI brain had a hiccup. Try again! 🧠💫" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("explain-jargon error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
