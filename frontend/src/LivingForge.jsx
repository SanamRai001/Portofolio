import { useEffect, useRef } from 'react'
import { FORGE_REACTION_EVENT } from './forgeEvents'
import './LivingForge.css'

const FORGE_WIDTH = 124;
const FORGE_HEIGHT = 134;
const SAFE_DISTANCE = 132;
const EDGE_MARGIN = 20;
const SPARK_COLORS = ["#57DDF2", "#FFB85C", "#35C8B4"];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const LivingForge = ({ suspended = false }) => {
  const forgeRef = useRef(null);
  const sparkLayerRef = useRef(null);

  useEffect(() => {
    const forge = forgeRef.current;
    const sparkLayer = sparkLayerRef.current;
    if (!forge || !sparkLayer) return undefined;

    if (suspended) {
      forge.dataset.state = "idle";
      sparkLayer.replaceChildren();
      return undefined;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");

    if (reducedMotion.matches) {
      forge.dataset.motion = "reduced";
      forge.dataset.state = "idle";
      return undefined;
    }

    if (!finePointer.matches) {
      forge.dataset.mobile = "true";
      forge.dataset.state = "look";
      return undefined;
    }

    let position = {
      x: window.innerWidth * 0.82 - FORGE_WIDTH / 2,
      y: window.innerHeight * 0.34 - FORGE_HEIGHT / 2
    };
    let target = { ...position };
    let velocity = { x: 0, y: 0 };
    let animationFrame = 0;
    let animationRunning = false;
    let lastSparkAt = 0;
    let sparkIndex = 0;
    let lastPointer = { x: 0, y: 0 };
    let reactionTimer = 0;
    let reactionActive = false;
    let yieldingToIsland = false;
    const calmTimers = new Set();
    const sparkTimers = new Set();

    const applyPosition = () => {
      forge.style.transform =
        "translate3d(" + position.x.toFixed(2) + "px, " + position.y.toFixed(2) + "px, 0)";
    };

    const clearCalmTimers = () => {
      calmTimers.forEach((timer) => window.clearTimeout(timer));
      calmTimers.clear();
    };

    const addCalmTimer = (callback, delay) => {
      const timer = window.setTimeout(() => {
        calmTimers.delete(timer);
        callback();
      }, delay);
      calmTimers.add(timer);
    };

    const scheduleCalmSequence = () => {
      if (reactionActive) return;
      clearCalmTimers();
      addCalmTimer(() => { forge.dataset.state = "look"; }, 760);
      addCalmTimer(() => { forge.dataset.state = "blink"; }, 2600);
      addCalmTimer(() => { forge.dataset.state = "look"; }, 3060);
      addCalmTimer(() => { forge.dataset.state = "think"; }, 5200);
      addCalmTimer(() => { forge.dataset.state = "look"; }, 6800);
    };

    const step = () => {
      const stiffness = 0.042;
      const damping = 0.82;

      velocity.x = (velocity.x + (target.x - position.x) * stiffness) * damping;
      velocity.y = (velocity.y + (target.y - position.y) * stiffness) * damping;
      position.x += velocity.x;
      position.y += velocity.y;

      applyPosition();

      const remaining = Math.hypot(target.x - position.x, target.y - position.y);
      const speed = Math.hypot(velocity.x, velocity.y);

      if (remaining > 0.4 || speed > 0.18) {
        animationFrame = window.requestAnimationFrame(step);
      } else {
        animationRunning = false;
        animationFrame = 0;
      }
    };

    const startAnimation = () => {
      if (animationRunning) return;
      animationRunning = true;
      animationFrame = window.requestAnimationFrame(step);
    };

    const spawnSpark = () => {
      if (yieldingToIsland) return;

      const spark = document.createElement("span");
      spark.className = "LivingForgeSpark";
      spark.style.left = (position.x + FORGE_WIDTH / 2) + "px";
      spark.style.top = (position.y + FORGE_HEIGHT / 2) + "px";
      spark.style.setProperty("--spark-color", SPARK_COLORS[sparkIndex % SPARK_COLORS.length]);
      spark.style.setProperty("--spark-drift", ((sparkIndex % 3) - 1) * 10 + "px");
      sparkIndex += 1;
      sparkLayer.appendChild(spark);

      const timer = window.setTimeout(() => {
        spark.remove();
        sparkTimers.delete(timer);
      }, 620);
      sparkTimers.add(timer);
    };

    const playReaction = (event) => {
      const { state, duration = 1100, source = "system" } = event.detail || {};
      if (!state) return;

      clearCalmTimers();

      if (reactionTimer) {
        window.clearTimeout(reactionTimer);
        reactionTimer = 0;
      }

      reactionActive = true;
      forge.dataset.state = state;
      forge.dataset.context = source;

      if (state === "celebrate") {
        spawnSpark();
        spawnSpark();
        spawnSpark();
      }

      reactionTimer = window.setTimeout(() => {
        reactionActive = false;
        reactionTimer = 0;
        delete forge.dataset.context;
        forge.dataset.state = "idle";
        scheduleCalmSequence();
      }, duration);
    };

    const onPointerMove = (event) => {
      if (yieldingToIsland) return;

      const centerX = position.x + FORGE_WIDTH / 2;
      const centerY = position.y + FORGE_HEIGHT / 2;
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const distance = Math.hypot(dx, dy);

      let unitX;
      let unitY;

      if (distance < 4) {
        unitX = event.clientX < window.innerWidth / 2 ? 1 : -1;
        unitY = 0;
      } else {
        unitX = dx / distance;
        unitY = dy / distance;
      }

      const targetCenterX = event.clientX - unitX * SAFE_DISTANCE;
      const targetCenterY = event.clientY - unitY * SAFE_DISTANCE;

      target.x = clamp(
        targetCenterX - FORGE_WIDTH / 2,
        EDGE_MARGIN,
        window.innerWidth - FORGE_WIDTH - EDGE_MARGIN
      );
      target.y = clamp(
        targetCenterY - FORGE_HEIGHT / 2,
        84,
        window.innerHeight - FORGE_HEIGHT - EDGE_MARGIN
      );

      const horizontalIntent = clamp(dx / Math.max(window.innerWidth * 0.35, 1), -1, 1);
      forge.style.setProperty("--forge-tilt", (horizontalIntent * 4.5).toFixed(2) + "deg");

      if (!reactionActive) {
        forge.dataset.state = "moving";
        clearCalmTimers();
        scheduleCalmSequence();
      }

      startAnimation();

      const pointerTravel = Math.hypot(event.clientX - lastPointer.x, event.clientY - lastPointer.y);
      const now = performance.now();

      if (pointerTravel > 18 && now - lastSparkAt > 70) {
        spawnSpark();
        lastSparkAt = now;
        lastPointer = { x: event.clientX, y: event.clientY };
      }
    };

    const onPointerLeave = () => {
      clearCalmTimers();

      if (!reactionActive) {
        forge.dataset.state = "idle";
      }

      forge.style.setProperty("--forge-tilt", "0deg");
      target = {
        x: clamp(window.innerWidth * 0.82 - FORGE_WIDTH / 2, EDGE_MARGIN, window.innerWidth - FORGE_WIDTH - EDGE_MARGIN),
        y: clamp(window.innerHeight * 0.34 - FORGE_HEIGHT / 2, 84, window.innerHeight - FORGE_HEIGHT - EDGE_MARGIN)
      };
      startAnimation();
    };

    const onResize = () => {
      target.x = clamp(target.x, EDGE_MARGIN, window.innerWidth - FORGE_WIDTH - EDGE_MARGIN);
      target.y = clamp(target.y, 84, window.innerHeight - FORGE_HEIGHT - EDGE_MARGIN);
      position.x = clamp(position.x, EDGE_MARGIN, window.innerWidth - FORGE_WIDTH - EDGE_MARGIN);
      position.y = clamp(position.y, 84, window.innerHeight - FORGE_HEIGHT - EDGE_MARGIN);
      applyPosition();
    };

    const islandPanel = document.querySelector(".HeroPanel");
    const islandObserver = islandPanel
      ? new IntersectionObserver(
          ([entry]) => {
            yieldingToIsland = entry.isIntersecting && entry.intersectionRatio >= 0.45;
            forge.dataset.yielding = yieldingToIsland ? "true" : "false";

            if (yieldingToIsland) {
              clearCalmTimers();
              forge.dataset.state = "idle";
            } else if (!reactionActive) {
              scheduleCalmSequence();
            }
          },
          { threshold: [0, 0.45, 0.75] }
        )
      : null;

    if (islandPanel && islandObserver) {
      islandObserver.observe(islandPanel);
    }

    forge.dataset.state = "idle";
    forge.dataset.yielding = "false";
    applyPosition();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener(FORGE_REACTION_EVENT, playReaction);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener(FORGE_REACTION_EVENT, playReaction);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
      if (islandObserver) islandObserver.disconnect();

      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (reactionTimer) window.clearTimeout(reactionTimer);
      clearCalmTimers();
      sparkTimers.forEach((timer) => window.clearTimeout(timer));
      sparkTimers.clear();
      sparkLayer.replaceChildren();
    };
  }, [suspended]);

  return (
    <>
      <div
        className="LivingForge"
        ref={forgeRef}
        data-state="idle"
        data-suspended={suspended ? "true" : "false"}
        aria-hidden="true"
      >
        <span className="LivingForgeAura" />
        <span className="LivingForgeSprite" />
      </div>
      <div
        className="LivingForgeSparkLayer"
        ref={sparkLayerRef}
        data-suspended={suspended ? "true" : "false"}
        aria-hidden="true"
      />
    </>
  )
}

export default LivingForge
