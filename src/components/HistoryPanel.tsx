import { motion, AnimatePresence } from "framer-motion";
import { History, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HistoryEntry, clearHistory } from "@/lib/history";
import { useState } from "react";
import { toast } from "sonner";

interface HistoryPanelProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
}

export function HistoryPanel({ history, onSelect, onClear }: HistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (history.length === 0) return null;

  const handleClear = () => {
    onClear();
    toast.success("History cleared! 🧹");
  };

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 font-display text-lg text-foreground hover:text-primary transition-colors w-full"
      >
        <History className="h-5 w-5" />
        Past Explanations ({history.length})
        {isOpen ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-2"
          >
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleClear} className="text-destructive font-body rounded-xl">
                <Trash2 className="mr-1 h-4 w-4" /> Clear All
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {history.map((entry) => (
                <motion.div
                  key={entry.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => onSelect(entry)}
                  className="cursor-pointer"
                >
                  <Card className="border border-border hover:border-primary/30 rounded-xl transition-colors bg-card/60">
                    <CardContent className="p-3">
                      <p className="text-sm font-body font-semibold text-foreground truncate">
                        "{entry.jargon}"
                      </p>
                      <p className="text-xs text-muted-foreground font-body mt-1 line-clamp-2">
                        {entry.explanation.slice(0, 100)}…
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
