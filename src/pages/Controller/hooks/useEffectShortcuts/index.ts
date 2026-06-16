import { useEffect, useRef } from "react";

/**
 * エフェクト定義
 * key: ショートカットキー (Shift + キー)
 * label: 表示名
 * filters: CSSフィルター (Record<string, string> 形式)
 *          空オブジェクトはエフェクトなし（リセット）
 */
export const EFFECT_SHORTCUTS: {
  key: string;
  label: string;
  filters: Record<string, string>;
}[] = [
  { key: "1", label: "リセット",     filters: {} },
  { key: "2", label: "色反転",       filters: { invert: "100%" } },
  { key: "3", label: "グレースケール", filters: { grayscale: "100%" } },
  { key: "4", label: "セピア",       filters: { sepia: "100%" } },
  { key: "5", label: "ブラー",       filters: { blur: "8px" } },
  { key: "6", label: "色相回転",     filters: { "hue-rotate": "180deg" } },
  { key: "7", label: "明るさ強調",   filters: { brightness: "2" } },
  { key: "8", label: "彩度強調",     filters: { saturate: "5" } },
];

/**
 * どのデッキにエフェクトを適用するか
 * "left"  : 左デッキのみ (ch[0])
 * "right" : 右デッキのみ (ch[1])
 * "both"  : 両デッキ
 */
export type EffectTarget = "left" | "right" | "both";

interface UseEffectShortcutsOptions {
  /** エフェクトを適用するデッキ (デフォルト: "both") */
  target?: EffectTarget;
}

/**
 * Shift + 数字キー で投影ウィンドウにCSSエフェクトをかけるhook
 *
 * Shift+1 : リセット（エフェクトなし）
 * Shift+2 : 色反転 (invert)
 * Shift+3 : グレースケール
 * Shift+4 : セピア
 * Shift+5 : ブラー
 * Shift+6 : 色相回転 (hue-rotate)
 * Shift+7 : 明るさ強調 (brightness)
 * Shift+8 : 彩度強調 (saturate)
 */
export function useEffectShortcuts({ target = "both" }: UseEffectShortcutsOptions = {}) {
  const targetRef = useRef(target);
  targetRef.current = target;

  // 各チャンネルの現在アクティブなエフェクトキーを管理
  const activeEffectRef = useRef<Record<number, string>>({ 0: "1", 1: "1" });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") return;
      if (!e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;

      const shortcut = EFFECT_SHORTCUTS.find((s) => s.key === e.key);
      if (!shortcut) return;
      e.preventDefault();

      const applyToChannel = (chId: number) => {
        const deckAPI = window.ch?.[chId];
        if (!deckAPI) return;
        const isReset = Object.keys(shortcut.filters).length === 0;
        const isActive = activeEffectRef.current[chId] === shortcut.key && !isReset;
        if (isReset || isActive) {
          deckAPI.clearFilters();
          activeEffectRef.current[chId] = "1";
        } else {
          deckAPI.setFilters(shortcut.filters);
          activeEffectRef.current[chId] = shortcut.key;
        }
      };

      const t = targetRef.current;
      if (t === "left" || t === "both") applyToChannel(0);
      if (t === "right" || t === "both") applyToChannel(1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
