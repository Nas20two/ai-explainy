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

  const { repoUrl } = await req.json();
  if (!repoUrl) {
    return new Response(JSON.stringify({ error: "repoUrl required" }), { status: 400 });
  }

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
  if (!match) {
    return new Response(JSON.stringify({ error: "Invalid GitHub URL" }), { status: 400 });
  }

  const [, owner, name] = match;

  const githubFetch = async <T,>(path: string): Promise<T> => {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "ai-explainy" },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    return res.json();
  };

  try {
    // Fetch repo metadata
    const meta = await githubFetch<{
      name: string;
      description: string | null;
      stargazers_count: number;
      language: string | null;
      default_branch: string;
    }>(`/repos/${owner}/${name}`);

    // Fetch README
    let readmeContent = "";
    try {
      const readme = await githubFetch<{ content: string; encoding: string }>(
        `/repos/${owner}/${name}/readme`
      );
      if (readme.encoding === "base64") {
        readmeContent = atob(readme.content);
      }
    } catch { /* no README */ }

    // Fetch file tree
    let fileTree: Array<Record<string, unknown>> = [];
    try {
      const tree = await githubFetch<{
        tree: Array<{ path: string; type: string }>;
        truncated: boolean;
      }>(`/repos/${owner}/${name}/git/trees/${meta.default_branch}?recursive=1`);
      fileTree = tree.tree.slice(0, 200) as any;
    } catch { /* tree too large or private */ }

    // AI Summary via OpenRouter
    let summary = "";
    let keyFiles: string[] = [];

    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (openrouterKey) {
      try {
        const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openrouterKey}`,
            "HTTP-Referer": "https://ai-explainy.vercel.app",
            "X-Title": "Dev Companion Repo Analyzer",
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-v4-flash", // Cheap coding model
            messages: [
              {
                role: "system",
                content: `You analyze GitHub repos. Given metadata + file structure, provide:
1. A 2-3 sentence architecture summary
2. 3-5 key files to understand the codebase
Return JSON: {"summary":"...","keyFiles":["path1","path2"]}`,
              },
              {
                role: "user",
                content: JSON.stringify({
                  repo: `${owner}/${name}`,
                  description: meta.description,
                  language: meta.language,
                  stars: meta.stargazers_count,
                  readme: readmeContent.substring(0, 2000),
                  files: (fileTree as Array<{ path: string }>).slice(0, 100).map((f) => f.path),
                }),
              },
            ],
            response_format: { type: "json_object" },
            max_tokens: 1024,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          try {
            const parsed = JSON.parse(aiData.choices[0].message.content);
            summary = parsed.summary || "";
            keyFiles = parsed.keyFiles || [];
          } catch { /* invalid json */ }
        }
      } catch { /* AI failed, return without summary */ }
    }

    // Build hierarchical tree
    const treeMap = new Map<string, { path: string; type: string; name: string; children: Record<string, unknown>[] }>();
    for (const item of fileTree as unknown as Array<{ path: string; type: string }>) {
      const parts = item.path.split("/");
      let currentPath = "";

      for (let i = 0; i < parts.length; i++) {
        const isLast = i === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];

        if (!treeMap.has(currentPath)) {
          treeMap.set(currentPath, {
            path: currentPath,
            name: parts[i],
            type: isLast ? item.type : "tree",
            children: [],
          });
        }
      }
    }

    const root: Record<string, unknown>[] = [];
    for (const [, node] of treeMap) {
      const parts = node.path.split("/");
      if (parts.length === 1) {
        root.push(node as any);
      } else {
        const parentPath = parts.slice(0, -1).join("/");
        const parent = treeMap.get(parentPath);
        if (parent) parent.children.push(node as any);
      }
    }

    return new Response(JSON.stringify({
      owner, name,
      description: meta.description || "",
      stars: meta.stargazers_count,
      language: meta.language || "",
      summary, keyFiles, fileTree: root,
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "Failed to analyze repo",
    }), { status: 500, headers: corsHeaders });
  }
});
