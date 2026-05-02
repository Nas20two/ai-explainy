import { motion } from "framer-motion";
import { RepoExplorer } from "@/components/repo/RepoExplorer";

const RepoPage = () => (
  <div className="min-h-screen px-4 py-6">
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 text-center"
    >
      <h1 className="mb-2 text-3xl font-bold gradient-text">
        Repo Explainer 🔍
      </h1>
      <p className="text-muted-foreground">
        Paste a GitHub URL and get an AI-powered architecture overview
      </p>
    </motion.div>
    <div className="mx-auto max-w-3xl">
      <RepoExplorer />
    </div>
  </div>
);

export default RepoPage;
