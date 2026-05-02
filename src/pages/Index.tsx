import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { JargonInput } from "@/components/JargonInput";
import { ExplanationCard } from "@/components/ExplanationCard";
import { ExampleLibrary } from "@/components/ExampleLibrary";
import { HistoryPanel } from "@/components/HistoryPanel";
import { streamExplanation } from "@/lib/stream-chat";
import { getHistory, addToHistory, clearHistory, HistoryEntry } from "@/lib/history";
import { toast } from "sonner";
import { InstallBanner } from "@/components/InstallBanner";
import { MessageSquare, Search, Sparkles, ArrowRight } from "lucide-react";

const Index = () => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentJargon, setCurrentJargon] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [history, setHistory] = useState(getHistory);
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  const explain = useCallback(async (jargon: string) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setCurrentJargon(jargon);
    setExplanation("");
    setIsLoading(true);
    setIsStreaming(true);

    let fullText = "";

    await streamExplanation({
      jargon,
      signal: controller.signal,
      onDelta: (chunk) => {
        fullText += chunk;
        setExplanation(fullText);
      },
      onDone: () => {
        setIsLoading(false);
        setIsStreaming(false);
        if (fullText) {
          const entry = addToHistory(jargon, fullText);
          setHistory(getHistory());
        }
      },
      onError: (err) => {
        setIsLoading(false);
        setIsStreaming(false);
        toast.error(err);
      },
    });
  }, []);

  const handleExampleSelect = (text: string) => {
    setInput(text);
    explain(text);
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setCurrentJargon(entry.jargon);
    setExplanation(entry.explanation);
    setInput(entry.jargon);
    setIsStreaming(false);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const featureCards = [
    {
      icon: Sparkles,
      title: "Jargon Buster",
      desc: "Paste any AI buzzword and get a simple, fun explanation that actually makes sense.",
      action: "Try it below",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: MessageSquare,
      title: "Dev Companion Chat",
      desc: "Have a real conversation with AI about code, architecture, debugging, or any tech problem.",
      action: "Start Chatting",
      route: "/chat",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Search,
      title: "Repo Explainer",
      desc: "Drop a GitHub repository URL and get an instant architecture breakdown with AI summary.",
      action: "Analyze a Repo",
      route: "/repo",
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 md:py-12">
      <InstallBanner />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center max-w-2xl"
      >
        <h1 className="text-4xl md:text-6xl font-display font-bold gradient-text mb-4">
          AI Explainy 🤖
        </h1>
        <p className="text-lg md:text-xl font-body text-muted-foreground max-w-lg mx-auto">
          Three tools to make AI and code <span className="text-purple-400 font-medium">actually</span> make sense.
        </p>
      </motion.div>

      {/* Feature cards grid */}
      <div className="w-full max-w-4xl grid gap-4 md:grid-cols-3 mb-10 px-2">
        {featureCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className={`group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 ${
              card.route ? "cursor-pointer" : ""
            }`}
            onClick={() => card.route && navigate(card.route)}
          >
            {/* Gradient accent bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`}
            />

            <div className="flex h-full flex-col">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <card.icon className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="mb-1.5 text-base font-semibold">{card.title}</h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                {card.desc}
              </p>
              {card.route ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-purple-400 transition-all group-hover:gap-2">
                  {card.action}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span className="text-xs text-purple-400/60">{card.action}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Jargon Buster Section */}
      <div className="w-full max-w-2xl space-y-6" id="jargon-buster">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-1.5 text-sm text-purple-400">
            <Sparkles className="h-3.5 w-3.5" />
            Try it now — paste any AI term below
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <JargonInput
            onSubmit={explain}
            isLoading={isLoading}
            value={input}
            onChange={setInput}
          />
        </motion.div>

        {explanation && (
          <ExplanationCard
            jargon={currentJargon}
            explanation={explanation}
            isStreaming={isStreaming}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <ExampleLibrary onSelect={handleExampleSelect} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <HistoryPanel
            history={history}
            onSelect={handleHistorySelect}
            onClear={handleClearHistory}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
