import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface JargonInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function JargonInput({ onSubmit, isLoading, value, onChange }: JargonInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) onSubmit(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <Textarea
        placeholder='Paste confusing AI jargon here... 🤔&#10;&#10;e.g. "The LLM hallucinated due to high temperature settings"'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[120px] text-base font-body rounded-2xl border-2 border-primary/20 bg-card/80 backdrop-blur-sm focus:border-primary/50 resize-none transition-all"
        disabled={isLoading}
      />
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          type="submit"
          disabled={!value.trim() || isLoading}
          className="w-full gradient-btn text-primary-foreground font-display text-lg py-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-0"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Explain It! 🪄
            </>
          )}
        </Button>
      </motion.div>
    </form>
  );
}
