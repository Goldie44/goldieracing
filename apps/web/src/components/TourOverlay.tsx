// apps/web/src/components/TourOverlay.tsx
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTour } from "@/lib/TourContext";
import { computeSpotlightBox, computeTooltipPlacement, type Rect } from "@/lib/tourPositioning";

const LOCATE_TIMEOUT_MS = 4000;

export default function TourOverlay() {
  const { active, currentStep, stepIndex, totalSteps, next, prev, skip } = useTour();
  const { t } = useTranslation("tour");
  const location = useLocation();
  const navigate = useNavigate();
  const [targetRect, setTargetRect] = useState<Rect | null>(null);

  // Kept in a ref so the locate effect below can always call the latest
  // `next` without needing it in its dependency array (which would restart
  // the polling loop's attempt count on every TourProvider re-render).
  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  // Navigate to the step's page.
  useEffect(() => {
    if (!active || !currentStep) return;
    if (location.pathname !== currentStep.path) {
      navigate(currentStep.path);
    }
  }, [active, currentStep, location.pathname, navigate]);

  // Locate the target element once we're on the right page.
  useEffect(() => {
    if (!active || !currentStep) {
      setTargetRect(null);
      return;
    }
    if (location.pathname !== currentStep.path) {
      setTargetRect(null);
      return;
    }

    let frame: number;
    const startedAt = performance.now();
    const locate = () => {
      const el = document.querySelector(`[data-tour-id="${currentStep.targetId}"]`);
      if (!el) {
        if (performance.now() - startedAt >= LOCATE_TIMEOUT_MS) {
          // The target never showed up (e.g. a fresh save with no computed
          // deficits/strategy/races yet) — skip this step instead of
          // leaving the tour silently stuck with nothing rendered. A wall-clock
          // timeout (rather than a frame count) avoids false positives when a
          // page's first render after navigation just takes a bit longer.
          nextRef.current();
          return;
        }
        frame = requestAnimationFrame(locate);
        return;
      }
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      const rect = el.getBoundingClientRect();
      setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };
    frame = requestAnimationFrame(locate);
    return () => cancelAnimationFrame(frame);
  }, [active, currentStep, location.pathname]);

  // Escape closes the tour.
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, skip]);

  if (!active || !currentStep || !targetRect) return null;

  const spotlight = computeSpotlightBox(targetRect);
  const placement = computeTooltipPlacement(targetRect, window.innerHeight);
  const isLastStep = stepIndex + 1 === totalSteps;

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={(e) => e.stopPropagation()} />
      <motion.div
        className="fixed z-[101] rounded-lg pointer-events-none"
        style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.75)" }}
        animate={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      />
      <motion.div
        key={currentStep.id}
        initial={{ opacity: 0, y: placement === "bottom" ? -8 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed z-[102] w-[320px] bg-card border border-border rounded-xl p-4 shadow-xl"
        style={{
          top: placement === "bottom" ? spotlight.top + spotlight.height + 12 : undefined,
          bottom: placement === "top" ? window.innerHeight - spotlight.top + 12 : undefined,
          left: Math.min(Math.max(spotlight.left, 16), window.innerWidth - 336),
        }}
      >
        <p className="text-xs font-mono text-primary mb-1">
          {t("stepIndicator", { current: stepIndex + 1, total: totalSteps })}
        </p>
        <h3 className="text-sm font-semibold text-foreground mb-1">{t(currentStep.titleKey)}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t(currentStep.bodyKey)}</p>
        <div className="flex items-center justify-between">
          <button
            onClick={skip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("skip")}
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                onClick={prev}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-secondary transition-colors"
              >
                {t("previous")}
              </button>
            )}
            <button
              onClick={next}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isLastStep ? t("finish") : t("next")}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
