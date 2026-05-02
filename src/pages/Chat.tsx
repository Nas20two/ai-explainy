import { motion } from "framer-motion";
import { ChatContainer } from "@/components/chat/ChatContainer";

const ChatPage = () => (
  <div className="min-h-screen px-4 py-6">
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 text-center"
    >
      <h1 className="mb-2 text-3xl font-bold gradient-text">
        Dev Companion Chat 💬
      </h1>
      <p className="text-muted-foreground">
        Ask anything about code, repos, or tech concepts
      </p>
    </motion.div>
    <ChatContainer />
  </div>
);

export default ChatPage;
