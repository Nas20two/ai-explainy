import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Loader2, MessageSquare, Plus, Trash2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Thread {
  id: string;
  title: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function ChatContainer() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [creatingThread, setCreatingThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamContentRef = useRef("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load threads (anonymous-friendly — insert with a fixed user_id if needed)
  const loadThreads = useCallback(async () => {
    setLoadingThreads(true);
    const { data } = await supabase
      .from("threads")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) setThreads(data);
    setLoadingThreads(false);
  }, []);

  const createThread = useCallback(async () => {
    setCreatingThread(true);
    const { data, error } = await supabase
      .from("threads")
      .insert({ title: "New Chat 💬", type: "general" })
      .select()
      .single();
    if (error) {
      toast.error("Couldn't create thread. Check database RLS or use anon access.");
      setCreatingThread(false);
      return;
    }
    if (data) {
      setActiveThreadId(data.id);
      setMessages([]);
      loadThreads();
    }
    setCreatingThread(false);
  }, [loadThreads]);

  const deleteThread = useCallback(async (id: string) => {
    await supabase.from("threads").delete().eq("id", id);
    if (activeThreadId === id) {
      setActiveThreadId(null);
      setMessages([]);
    }
    loadThreads();
  }, [activeThreadId, loadThreads]);

  const updateThreadTitle = useCallback(async (id: string, firstMessage: string) => {
    const title = firstMessage.length > 40
      ? firstMessage.substring(0, 40) + "..."
      : firstMessage;
    await supabase.from("threads").update({ title }).eq("id", id);
    loadThreads();
  }, [loadThreads]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || streaming || !activeThreadId) return;
    const content = input.trim();
    setInput("");

    // Insert user message
    const { data: userMsg } = await supabase
      .from("messages")
      .insert({ thread_id: activeThreadId, role: "user", content })
      .select()
      .single();

    if (userMsg) setMessages((prev) => [...prev, userMsg as ChatMessage]);

    // Auto-title the thread on first user message
    const thread = threads.find((t) => t.id === activeThreadId);
    if (thread?.title === "New Chat 💬") {
      updateThreadTitle(activeThreadId, content);
    }

    setStreaming(true);
    streamContentRef.current = "";

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dev-companion-chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: activeThreadId, message: content }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Chat failed");
      }

      // Stream the response — local-only during streaming, save once at end
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream available");
      let fullContent = "";
      const decoder = new TextDecoder();
      const localId = crypto.randomUUID();

      // Insert optimistic local message
      setMessages((prev) => [
        ...prev,
        { id: localId, role: "assistant" as const, content: "", created_at: new Date().toISOString() },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode all the raw bytes at once (no SSE parsing needed — we send plain text)
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        // Local-only update — fast
        setMessages((prev) =>
          prev.map((m) => (m.id === localId ? { ...m, content: fullContent } : m))
        );
      }

      // Save to Supabase once at the end
      await supabase.from("messages").insert({
        thread_id: activeThreadId,
        role: "assistant",
        content: fullContent,
      });

      // Replace local message with DB-backed one
      const { data: saved } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", activeThreadId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (saved?.[0]) {
        setMessages((prev) =>
          prev.map((m) => (m.id === localId ? (saved[0] as ChatMessage) : m))
        );
      }
    } catch (err) {
      toast.error("Failed to get AI response — check console for details");
      console.error("Chat error:", err);
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, activeThreadId, threads, updateThreadTitle]);

  // Load messages when thread changes
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    supabase
      .from("messages")
      .select("*")
      .eq("thread_id", activeThreadId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data as ChatMessage[]) ?? []));
  }, [activeThreadId]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Thread sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden w-64 shrink-0 flex-col rounded-xl border bg-card md:flex"
      >
        <div className="border-b p-3">
          <button
            onClick={createThread}
            disabled={creatingThread}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-purple-500/50 px-3 py-2.5 text-sm font-medium text-purple-400 transition-all hover:border-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
          >
            {creatingThread ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            New Thread
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loadingThreads ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : threads.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              No threads yet — start one above
            </p>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveThreadId(t.id);
                  setMessages([]);
                }}
                className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  t.id === activeThreadId
                    ? "bg-purple-500/15 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-purple-400/70" />
                <span className="flex-1 truncate">{t.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteThread(t.id);
                  }}
                  className="shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-red-500/20 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </button>
              </button>
            ))
          )}
        </div>
      </motion.div>

      {/* Chat area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col rounded-xl border bg-card"
      >
        {activeThreadId ? (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Bot className="mb-3 h-10 w-10 text-purple-400" />
                  <h3 className="mb-1 text-lg font-medium">Dev Companion</h3>
                  <p className="mb-2 max-w-sm text-sm text-muted-foreground">
                    Ask me anything about coding, architecture, debugging, or
                    tech concepts. I'm here to help! 🚀
                  </p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {[
                      "Explain React hooks",
                      "Debug an issue",
                      "What's the best DB for my project?",
                      "How does Docker work?",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setInput(suggestion);
                        }}
                        className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-purple-500 hover:text-purple-400"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      msg.role === "user" ? "bg-purple-600" : "bg-muted"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-purple-400" />
                    )}
                  </div>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      msg.role === "user"
                        ? "rounded-tr-sm bg-purple-600 text-white"
                        : "rounded-tl-sm bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content || (
                        <span className="inline-flex gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-purple-400" />
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-purple-400"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-purple-400"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    (e.preventDefault(), sendMessage())
                  }
                  placeholder={
                    streaming ? "AI is thinking..." : "Ask about code or tech..."
                  }
                  disabled={streaming}
                  className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || streaming}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white transition-all hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/25 active:scale-95 disabled:opacity-50 disabled:hover:shadow-none"
                >
                  {streaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
                <Zap className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="mb-2 text-xl font-bold gradient-text">
                Dev Companion Chat
              </h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Have a conversation with AI about your code, project architecture,
                or any tech topic. Threads are saved automatically so you can pick
                up where you left off.
              </p>
              <button
                onClick={createThread}
                disabled={creatingThread}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-xl active:scale-95 disabled:opacity-50"
              >
                {creatingThread ? (
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 inline h-4 w-4" />
                )}
                Start a New Chat
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
