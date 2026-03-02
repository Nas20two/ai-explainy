import { motion } from "framer-motion";
import { Copy, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface ExplanationCardProps {
  jargon: string;
  explanation: string;
  isStreaming?: boolean;
}

export function ExplanationCard({ jargon, explanation, isStreaming }: ExplanationCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(explanation);
    setCopied(true);
    toast.success("Copied to clipboard! 📋");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareText = `🤖 AI Jargon Buster\n\n"${jargon}"\n\n${explanation}`;
    await navigator.clipboard.writeText(shareText);
    toast.success("Share text copied! Send it to a friend! 🚀");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="border-2 border-primary/20 bg-card/90 backdrop-blur-sm rounded-2xl overflow-hidden">
        <div className="gradient-btn h-1" />
        <CardContent className="p-6">
          <p className="text-sm font-body text-muted-foreground mb-3 italic">"{jargon}"</p>
          <div className="prose prose-sm max-w-none font-body text-card-foreground">
            <ReactMarkdown>{explanation}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-5 bg-primary animate-pulse rounded-sm ml-1" />
            )}
          </div>
          {!isStreaming && explanation && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-xl font-body">
                {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="rounded-xl font-body">
                <Share2 className="mr-1 h-4 w-4" />
                Share
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
