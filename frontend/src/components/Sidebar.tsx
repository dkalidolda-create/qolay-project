import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  onToggleTheme: () => void;
  dark: boolean;
}

const LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/history", label: "Measurement History" },
  { to: "/analytics", label: "Analytics" },
  { to: "/reports", label: "User Reports" },
];

export default function Sidebar({ open, onClose, onToggleTheme, dark }: Props) {
  const location = useLocation();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed top-0 left-0 h-full w-72 z-50 bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl border-r border-white/30 dark:border-slate-700/40 shadow-2xl p-6 flex flex-col gap-2"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-lg tracking-tight">
                Atrium Pulse
              </span>
              <button onClick={onClose} className="text-xl">
                ×
              </button>
            </div>

            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={`px-4 py-3 rounded-xl font-medium transition ${
                  location.pathname === link.to
                    ? "bg-white/60 dark:bg-slate-700/60 shadow"
                    : "hover:bg-white/30 dark:hover:bg-slate-800/40"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <button
              onClick={onToggleTheme}
              className="mt-auto px-4 py-3 rounded-xl font-medium bg-white/40 dark:bg-slate-800/50 hover:bg-white/60 dark:hover:bg-slate-700/60 transition text-left"
            >
              {dark ? "☀️ Light theme" : "🌙 Dark theme"}
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
