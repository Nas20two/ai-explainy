import { MessageSquare, Search, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";

export function Nav() {
  return (
    <nav className="flex items-center justify-center gap-1 py-4">
      <NavLink to="/">
        <Sparkles className="h-4 w-4" />
        Jargon Buster
      </NavLink>
      <NavLink to="/chat">
        <MessageSquare className="h-4 w-4" />
        Chat
      </NavLink>
      <NavLink to="/repo">
        <Search className="h-4 w-4" />
        Repo Explainer
      </NavLink>
    </nav>
  );
}
