import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { useState } from "react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";

export function InstallBanner() {
  const { isInstallable, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md"
      >
        <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-md p-4 shadow-lg flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl gradient-btn flex items-center justify-center text-primary-foreground text-lg">
            📲
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-sm text-foreground">Install Jargon Buster!</p>
            <p className="text-xs text-muted-foreground">Add to home screen for quick access</p>
          </div>
          <Button
            size="sm"
            onClick={install}
            className="gradient-btn text-primary-foreground font-semibold text-xs rounded-xl"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Install
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
