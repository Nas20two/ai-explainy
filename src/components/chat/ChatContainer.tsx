import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadThreads = useCallback(async () => {
    const { data } = await supabase
      .from("threads")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) setThreads(data);
  }, []);

  const createThread = useCallback(async () => {
    const { data } = await supabase
      .from("threads")
      .insert({ title: "New Chat", type: "general" })
      .select()
      .single();
    if (data) {
      setActiveThreadId(data.id);
      setMessages([]);
      loadThreads();
    }
  }, [loadThreads]);

  const deleteThread = useCallback(async (id: string) => {
    await supabase.from("threads").delete().eq("id", id);
    if (activeThreadId === id) setActiveThreadId(null);
    loadThreads();
  }, [activeThreadId, loadThreads]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || streaming || !activeThreadId) return;
    const content = input.trim();
    setInput("");

    const { data: userMsg } = await supabase
      .from("messages")
      .insert({ thread_id: activeThreadId, role: "user", content })
      .select()
      .single();

    if (userMsg) setMessages((prev) => [...prev, userMsg as ChatMessage]);

    setStreaming(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dev-companion-chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: activeThreadId, message: content }),
        }
      );

      if (!res.ok) throw new Error("Chat failed");

      const { data: assistantMsg } = await supabase
        .from("messages")
        .insert({ thread_id: activeThreadId, role: "assistant", content: "" })
        .select()
        .single();

      if (!assistantMsg) throw new Error("Failed to create placeholder");

      // Stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullContent += new TextDecoder().decode(value);
        await supabase
          .from("messages")
          .update({ content: fullContent })
          .eq("id", assistantMsg.id);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: fullContent } : m
          )
        );
      }
    } catch (err) {
      toast.error("Failed to get AI response");
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, activeThreadId]);

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

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <Bot className="mx-auto mb-4 h-12 w-12 text-purple-400" />
          <h2 className="mb-2 text-2xl font-bold gradient-text">Dev Companion Chat</h2>
          <p className="text-muted-foreground">
            Sign in to start chatting about code, repos, and tech concepts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Thread sidebar */}
      <div className="hidden w-64 shrink-0 flex-col rounded-xl border bg-card md:flex">
        <div className="border-b p-3">
          <button
            onClick={createThread}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground hover:border-purple-500 hover:text-purple-400"
          >
            <Plus className="h-4 w-4" /> New Thread
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveThreadId(t.id);
                setMessages([]);
              }}
              className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                t.id === activeThreadId
                  ? "bg-purple-500/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{t.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteThread(t.id);
                }}
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5 hover:text-red-400" />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col rounded-xl border bg-card">
        {activeThreadId ? (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
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
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder={streaming ? "AI is thinking..." : "Ask about code or tech..."}
                  disabled={streaming}
                  className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-purple-500 disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || streaming}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50"
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
              <Bot className="mx-auto mb-3 h-10 w-10 text-purple-400" />
              <h3 className="mb-1 text-lg font-medium">No thread selected</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Create a new thread to start a conversation.
              </p>
              <button
                onClick={createThread}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
              >
                <Plus className="mr-1 inline h-4 w-4" /> New Thread
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
