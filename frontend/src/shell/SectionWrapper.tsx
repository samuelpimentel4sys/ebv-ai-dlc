import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Entrada de conteúdo com a curva e a duração da seção 14 do DS. Quando o
 * sistema pede menos movimento, a transição cai para opacidade — a seção 25
 * proíbe animação de posição nesse caso.
 */
export function SectionWrapper({
  children,
  className,
  wide,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.12 : 0.32, ease: [0, 0, 0.2, 1] }}
      className={cn('mx-auto w-full px-5 py-6', wide ? 'max-w-[110rem]' : 'max-w-content', className)}
    >
      {children}
    </motion.div>
  );
}
