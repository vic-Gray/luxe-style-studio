import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Truck, type LucideIcon } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   HOW THIS WORKS
   ───────────────────────────────────────────────────────────────
   1. Bump UPDATE_VERSION any time you ship a feature you want to
      announce (e.g. "2026-06-22-image-modal").
   2. List what's new in UPDATE_FEATURES below.
   3. Mount <UpdateAnnouncement /> once, near the root of your app
      (e.g. inside App.tsx, alongside your <Navbar /> or Router).
   4. It checks localStorage for the last version the visitor has
      seen. If it doesn't match UPDATE_VERSION, it shows the modal.
      Once shown (and closed), that version is stored and it will
      NOT show again — until you bump the version next time.
─────────────────────────────────────────────────────────────────── */

const UPDATE_VERSION = "2026-09-04-location-sharing";
const STORAGE_KEY = "matteekay_last_seen_update";

// Logo path — matches the one used in Footer.tsx ("/logo.PNG" served from /public).
const LOGO_SRC = "/logo.PNG";

const UPDATE_FEATURES: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Share Your Location",
    description:
      "At checkout, tap Share My Location so our riders can find you faster — no more back-and-forth for directions.",
    icon: MapPin,
  },
  {
    title: "Faster, Smoother Delivery",
    description:
      "Sharing your location is optional, but it helps us get your order to your door quicker and with fewer delays.",
    icon: Truck,
  },
];

const UpdateAnnouncement = () => {
  const [show, setShow] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    try {
      const lastSeen = localStorage.getItem(STORAGE_KEY);
      if (lastSeen !== UPDATE_VERSION) {
        setShow(true);
      }
    } catch {
      // localStorage unavailable — fail silently, don't block the app
    }
  }, []);

  const handleClose = () => {
    try {
      localStorage.setItem(STORAGE_KEY, UPDATE_VERSION);
    } catch {
      // ignore
    }
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={handleClose}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, rgba(0,0,0,0.25), rgba(0,0,0,0.45))",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden"
            style={{
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(40px) saturate(180%)",
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 0 60px rgba(255,255,255,0.03)",
            }}
          >
            {/* Close button — glassy, high-contrast */}
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.25)",
                backdropFilter: "blur(16px) saturate(180%)",
                WebkitBackdropFilter: "blur(16px) saturate(180%)",
                boxShadow:
                  "0 2px 12px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.15)",
              }}
            >
              <X size={16} color="#ffffff" strokeWidth={2.5} />
            </button>

            <div className="p-6 md:p-7 space-y-5">
              {/* Logo chip — deliberately darker than the panel so a white
                  or light-colored logo never blends invisibly into the
                  glass. If the image 404s, a clean monogram fallback
                  shows instead of an empty/broken box. */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
              >
                {!logoFailed ? (
                  <img
                    src={LOGO_SRC}
                    alt="Logo"
                    className="w-9 h-9 object-contain"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <span className="text-white text-sm font-semibold tracking-widest">
                    MK
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-white/60 text-xs uppercase tracking-widest">
                  What's New
                </p>
                <h2 className="text-white text-l font-light">
                  Delivery just got easier — share your location so we can
                  find you faster
                </h2>
              </div>

              <div className="space-y-4">
                {UPDATE_FEATURES.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <div key={feature.title} className="flex gap-3">
                      {/* Glassy icon chip — same visual language as the
                          logo chip and close button above, just smaller. */}
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "rgba(255,255,255,0.10)",
                          border: "1px solid rgba(255,255,255,0.25)",
                          backdropFilter: "blur(12px) saturate(180%)",
                          WebkitBackdropFilter: "blur(12px) saturate(180%)",
                          boxShadow:
                            "inset 0 1px 1px rgba(255,255,255,0.2)",
                        }}
                      >
                        <Icon size={15} color="#ffffff" strokeWidth={2} />
                      </div>

                      <div>
                        <p className="text-white text-sm font-medium uppercase tracking-wide">
                          {feature.title}
                        </p>
                        <p className="text-white/70 text-sm mt-0.5">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleClose}
                className="w-full h-11 rounded-xl uppercase text-xs tracking-widest font-medium transition-all duration-300 cursor-pointer text-white hover:bg-white/20"
                style={{
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  backdropFilter: "blur(14px) saturate(180%)",
                  WebkitBackdropFilter: "blur(14px) saturate(180%)",
                  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25)",
                }}
              >
                Got It
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateAnnouncement;