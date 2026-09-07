import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Loader2, ArrowLeft, Home } from "lucide-react";

import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useCart } from "@/context/CartContext";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const reference = searchParams.get("reference") || "";

  const [status, setStatus] = useState<
    "loading" | "success" | "failed" | "error"
  >("loading");
  const [countdown, setCountdown] = useState(5);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!reference) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage("No payment reference provided.");
        }
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/payments/verify?reference=${reference}`,
        );

        const data = await res.json();

        if (!cancelled) {
          if ((data as { success?: boolean })?.success === true) {
            // clear cart only on confirmed success
            clearCart();
            setStatus("success");
          } else {
            setStatus("failed");
            setErrorMessage(
              (data as { message?: string })?.message || "Payment verification failed.",
            );
          }
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage("Network error. Please check your connection.");
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [reference, clearCart]);

  // Countdown redirect on success
  useEffect(() => {
    if (status !== "success") return;

    if (countdown <= 0) {
      navigate("/");
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status, countdown, navigate]);

  const isLoading = status === "loading";

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <MobileBottomNav />

      <main className="pt-28 flex items-center justify-center px-6 min-h-[70vh]">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center space-y-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-16 h-16 mx-auto rounded-full border-4 border-border border-t-foreground flex items-center justify-center"
              >
                <Loader2 size={24} className="text-foreground" />
              </motion.div>
              <p className="text-muted-foreground font-body">
                Verifying your payment…
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-6 max-w-sm w-full"
            >
              {/* Icon */}
              {status === "success" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 mx-auto rounded-full bg-green-500 text-white flex items-center justify-center"
                >
                  <CheckCircle size={40} />
                </motion.div>
              )}

              {status !== "success" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 mx-auto rounded-full bg-red-500 text-white flex items-center justify-center"
                >
                  <XCircle size={40} />
                </motion.div>
              )}

              {/* Heading */}
              {status === "success" && (
                <h1 className="font-display text-2xl md:text-3xl">
                  Payment Successful
                </h1>
              )}

              {status !== "success" && (
                <h1 className="font-display text-2xl md:text-3xl">
                  Payment Failed
                </h1>
              )}

              {/* Reference */}
              {reference && (
                <p className="text-muted-foreground font-body text-sm break-all">
                  Reference: {reference}
                </p>
              )}

              {/* Error message */}
              {errorMessage && (
                <p className="text-red-500 font-body text-sm">{errorMessage}</p>
              )}

              {/* Countdown */}
              {status === "success" && (
                <p className="text-muted-foreground font-body text-sm">
                  You will be redirected in{" "}
                  <span className="font-semibold text-foreground">
                    {countdown}
                  </span>{" "}
                  second{countdown !== 1 ? "s" : ""}.
                </p>
              )}

              {/* Buttons for failure */}
              {status !== "success" && (
                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  <button
                    onClick={() => navigate("/checkout")}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background font-body text-sm"
                  >
                    <ArrowLeft size={16} />
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="flex items-center justify-center gap-2 px-6 py-3 border border-border font-body text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                  >
                    <Home size={16} />
                    Go Home
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default PaymentCallback;
