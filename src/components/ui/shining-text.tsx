"use client" 


import { motion } from "framer-motion";
 
interface ShiningTextProps {
  text: string;
}

export function ShiningText({text}: ShiningTextProps) {
  return (
    <motion.div
      className="bg-[linear-gradient(110deg,var(--shining-base),35%,var(--shining-highlight),50%,var(--shining-base),75%,var(--shining-base))] bg-[length:200%_100%] bg-clip-text text-sm text-transparent m-0 inline-block"
      initial={{ backgroundPosition: "200% 0" }}
      animate={{ backgroundPosition: "-200% 0" }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: "linear",
      }}
    >
      {text}
    </motion.div>
  );
}
