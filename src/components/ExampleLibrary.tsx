import { motion } from "framer-motion";
import { EXAMPLE_JARGON } from "@/lib/examples";

interface ExampleLibraryProps {
  onSelect: (text: string) => void;
}

export function ExampleLibrary({ onSelect }: ExampleLibraryProps) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg text-foreground">Try an example 👇</h2>
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_JARGON.map((item, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(item.text)}
            className="px-3 py-2 bg-card border-2 border-border hover:border-primary/40 rounded-xl text-sm font-body text-foreground transition-colors cursor-pointer"
          >
            {item.emoji} {item.text.slice(0, 40)}…
          </motion.button>
        ))}
      </div>
    </div>
  );
}
