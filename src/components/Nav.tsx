import { MessageSquare, Search, Sparkles, ChevronRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const links = [
  {
    to: "/",
    icon: Sparkles,
    label: "Jargon Buster",
    desc: "Translate AI buzzwords into plain English",
  },
  {
    to: "/chat",
    icon: MessageSquare,
    label: "Chat",
    desc: "Talk about code, projects & tech concepts",
  },
  {
    to: "/repo",
    icon: Search,
    label: "Repo Explainer",
    desc: "Drop a GitHub URL & get the full picture",
  },
];

export function Nav() {
  return (
    <nav className="mx-auto flex max-w-2xl items-center justify-center gap-0.5 px-2 py-3 md:gap-1">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-purple-500/10 hover:text-purple-400 md:gap-2 md:px-4 md:py-2.5 md:text-sm"
          activeClassName="bg-purple-500/15 text-purple-400 shadow-sm"
        >
          <link.icon className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{link.label}</span>
          <span className="hidden text-[10px] text-muted-foreground/60 md:inline-block">
            — {link.desc}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
