import { motion } from "framer-motion";
import ChatBox from "./components/ChatBox";

export default function App() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <ChatBox />
    </motion.div>
  );
}