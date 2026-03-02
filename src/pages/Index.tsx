import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { JargonInput } from "@/components/JargonInput";
import { ExplanationCard } from "@/components/ExplanationCard";
import { ExampleLibrary } from "@/components/ExampleLibrary";
import { HistoryPanel } from "@/components/HistoryPanel";
import { streamExplanation } from "@/lib/stream-chat";
import { getHistory, addToHistory, clearHistory, HistoryEntry } from "@/lib/history";
import { toast } from "sonner";

const Index = () => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentJargon, setCurrentJargon] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [history, setHistory] = useState(getHistory);
  const abortRef = useRef<AbortController | null>(null);

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

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl md:text-6xl font-display font-bold gradient-text mb-3">
          AI Jargon Buster 🤖✨
        </h1>
        <p className="text-lg md:text-xl font-body text-muted-foreground max-w-lg mx-auto">
          Paste confusing AI talk and get a fun explanation even a 5-year-old would get! 🧒
        </p>
      </motion.div>

      <div className="w-full max-w-2xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
          transition={{ delay: 0.2 }}
        >
          <ExampleLibrary onSelect={handleExampleSelect} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
