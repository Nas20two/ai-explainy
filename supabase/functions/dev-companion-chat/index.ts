const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
  }

  const { threadId, message } = await req.json();
  if (!threadId || !message) {
    return new Response(JSON.stringify({ error: "threadId and message required" }), { status: 400, headers: corsHeaders });
  }

  const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!openrouterKey) {
    return new Response(JSON.stringify({ error: "OpenRouter not configured" }), { status: 500, headers: corsHeaders });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openrouterKey}`,
        "HTTP-Referer": "https://ai-explainy.vercel.app",
        "X-Title": "Dev Companion",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-v4-flash", // Cheap coding model
        messages: [
          {
            role: "system",
            content: `You are Dev Companion, an expert programming assistant built into AI Explainy.
Help developers understand code, architecture, and technical concepts.
Be concise and practical. Use examples when helpful.
When explaining technical concepts, relate them to everyday analogies.`,
          },
          { role: "user", content: message },
        ],
        stream: true,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "AI provider error" }), { status: 502, headers: corsHeaders });
    }

    // Stream the response as plain text chunks
    const reader = response.body?.getReader();
    if (!reader) {
      return new Response(JSON.stringify({ error: "No stream" }), { status: 500, headers: corsHeaders });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || "";
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }
              } catch {
                // skip malformed
              }
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        ...corsHeaders,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
