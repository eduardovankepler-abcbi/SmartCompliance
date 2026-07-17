import { useEffect, useState } from "react";

export function getSeriesTone(seed) {
  const palette = [
    {
      solid: "#4d88ff",
      soft: "rgba(77, 136, 255, 0.22)",
      gradient: "linear-gradient(180deg, rgba(109, 160, 255, 0.34), #4d88ff)"
    },
    {
      solid: "#70a2ff",
      soft: "rgba(112, 162, 255, 0.22)",
      gradient: "linear-gradient(180deg, rgba(145, 183, 255, 0.32), #70a2ff)"
    },
    {
      solid: "#34b8d8",
      soft: "rgba(52, 184, 216, 0.2)",
      gradient: "linear-gradient(180deg, rgba(90, 208, 235, 0.3), #34b8d8)"
    },
    {
      solid: "#6a75f6",
      soft: "rgba(106, 117, 246, 0.22)",
      gradient: "linear-gradient(180deg, rgba(128, 138, 248, 0.3), #6a75f6)"
    },
    {
      solid: "#3ec5a1",
      soft: "rgba(62, 197, 161, 0.22)",
      gradient: "linear-gradient(180deg, rgba(97, 215, 182, 0.3), #3ec5a1)"
    },
    {
      solid: "#ff8f4d",
      soft: "rgba(255, 143, 77, 0.2)",
      gradient: "linear-gradient(180deg, rgba(255, 170, 119, 0.3), #ff8f4d)"
    }
  ];

  const normalized = String(seed || "default");
  const hash = normalized.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function readCssVariable(name, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function getChartThemeTokens() {
  return {
    fontFamily: readCssVariable("--font-stack", "Aptos, Segoe UI, sans-serif"),
    text: readCssVariable("--text", "#f3f5f7"),
    muted: readCssVariable("--muted", "#9ea6b3"),
    line: readCssVariable("--line", "rgba(255, 255, 255, 0.08)"),
    surface: readCssVariable("--surface-strong", "rgba(24, 29, 39, 0.98)")
  };
}

export function withCanvasAlpha(color, alpha) {
  if (!color) {
    return `rgba(127, 138, 155, ${alpha})`;
  }

  if (color.startsWith("#") && color.length === 7) {
    const red = Number.parseInt(color.slice(1, 3), 16);
    const green = Number.parseInt(color.slice(3, 5), 16);
    const blue = Number.parseInt(color.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
  }

  if (color.startsWith("rgba(")) {
    return color.replace(/rgba\(([^)]+),\s*[\d.]+\)/, `rgba($1, ${alpha})`);
  }

  return color;
}

export function getCanvasSeriesTone(seed) {
  const tone = getSeriesTone(seed);
  return {
    ...tone,
    fill: withCanvasAlpha(tone.solid, 0.18),
    border: tone.solid,
    point: tone.solid,
    hover: withCanvasAlpha(tone.solid, 0.32)
  };
}

export function useChartThemeTokens() {
  const [tokens, setTokens] = useState(() => getChartThemeTokens());

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const updateTokens = () => setTokens(getChartThemeTokens());
    const observer = new MutationObserver(updateTokens);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "style", "class"]
    });
    window.addEventListener("resize", updateTokens);
    updateTokens();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateTokens);
    };
  }, []);

  return tokens;
}
