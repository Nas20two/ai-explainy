import { useState } from "react";
import { Search, Loader2, Star, Code2, ExternalLink, ChevronRight, File, Folder } from "lucide-react";
import { toast } from "sonner";

interface TreeNode {
  path: string;
  name: string;
  type: string;
  children?: TreeNode[];
}

interface RepoData {
  owner: string;
  name: string;
  description: string;
  stars: number;
  language: string;
  summary: string;
  keyFiles: string[];
  fileTree: TreeNode[];
}

function TreeNodeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isDir = node.type === "tree" || (node.children && node.children.length > 0);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex w-full items-center gap-1.5 rounded px-2 py-0.5 text-left text-xs transition-colors hover:bg-muted ${
          isDir ? "text-foreground" : "text-muted-foreground"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isDir ? (
          <>
            <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
            <Folder className="h-3 w-3 text-amber-500" />
          </>
        ) : (
          <File className="ml-3 h-3 w-3 text-blue-500" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isDir && expanded && node.children?.map((child) => (
        <TreeNodeItem key={child.path} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function RepoExplorer() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [repo, setRepo] = useState<RepoData | null>(null);
  const [error, setError] = useState("");

  const analyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError("");
    setRepo(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dev-companion-repo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl: url.trim() }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }

      const data = await res.json();
      setRepo(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to analyze repo";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={analyze} className="flex gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-purple-500"
          />
        </div>
        <button
          type="submit"
          disabled={!url.trim() || loading}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Analyze
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {repo && (
        <div className="space-y-4">
          {/* Repo card */}
          <div className="rounded-xl border bg-card p-5">
            <a
              href={`https://github.com/${repo.owner}/${repo.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-1 flex items-center gap-1.5 text-lg font-semibold text-purple-400 hover:text-purple-300"
            >
              {repo.owner}/{repo.name} <ExternalLink className="h-4 w-4" />
            </a>
            {repo.description && (
              <p className="mb-3 text-muted-foreground">{repo.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {repo.language && (
                <span className="flex items-center gap-1">
                  <Code2 className="h-4 w-4" /> {repo.language}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4" /> {repo.stars.toLocaleString()}
              </span>
            </div>

            {repo.summary && (
              <div className="mt-4 rounded-lg bg-purple-500/5 p-4">
                <h4 className="mb-1 text-sm font-medium">AI Architecture Summary</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {repo.summary}
                </p>
              </div>
            )}

            {repo.keyFiles.length > 0 && (
              <div className="mt-3 text-sm">
                <span className="font-medium">Key files:</span>{" "}
                <span className="text-muted-foreground">
                  {repo.keyFiles.join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* File tree */}
          {repo.fileTree.length > 0 && (
            <div className="rounded-xl border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">File Structure</h3>
              <div className="max-h-80 overflow-y-auto rounded-lg border bg-background">
                {repo.fileTree.map((node) => (
                  <TreeNodeItem key={node.path} node={node} depth={0} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!repo && !loading && !error && (
        <div className="rounded-xl border bg-card p-8 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h3 className="mb-1 text-lg font-medium">Analyze any GitHub repo</h3>
          <p className="text-sm text-muted-foreground">
            Paste a GitHub URL above to get an AI-powered architecture overview with file structure analysis.
          </p>
        </div>
      )}
    </div>
  );
}
