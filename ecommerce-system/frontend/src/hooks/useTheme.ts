import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

/**
 * 應用程式主題控制器 (React Hook)
 *
 * 核心邏輯:
 * 1. 初始化時，依以下優先級決定主題：
 *    - 優先級 1: 從 localStorage 讀取使用者手動儲存的設定。
 *    - 優先級 2: 偵測使用者作業系統的色彩偏好 (prefers-color-scheme)。
 *    - 優先級 3: 預設為 'light' (淺色) 主題。
 * 2. 將決定的主題應用到 `<html>` 元素的 `data-theme` 屬性上。
 * 3. 提供 `toggleTheme` 函數，供使用者手動切換，並將新選擇持久化到 localStorage。
 */
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // 採用函數式 state 初始化，確保這段邏輯只在元件首次渲染時執行一次
    try {
      // 優先級 1: 檢查 localStorage
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (storedTheme) {
        return storedTheme;
      }

      // 優先級 2: 檢查系統偏好
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';

    } catch (error) {
      // 在 SSR 或嚴格隱私設定下，存取 localStorage 可能失敗
      console.error("Could not access localStorage or matchMedia, defaulting to light theme.", error);
      return 'light'; // 備用預設值
    }
  });

  // Effect Hook：當 theme 狀態改變時，執行副作用
  useEffect(() => {
    const root = document.documentElement;
    
    // 移除舊主題，應用新主題
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);

    // 將新主題持久化到 localStorage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error("Could not save theme to localStorage.", error);
    }
  }, [theme]); // 依賴項陣列中只有 theme，所以只在 theme 改變時執行

  // 使用 useCallback 確保 toggleTheme 函數的引用穩定性
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, toggleTheme };
};