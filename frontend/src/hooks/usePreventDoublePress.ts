import { useRef, useCallback } from "react";

/**
 * Envolve uma função assíncrona (ou síncrona) garantindo que ela só seja
 * executada uma vez por vez. Enquanto a ação anterior não terminar, cliques
 * adicionais são simplesmente ignorados.
 *
 * Uso:
 *   const handlePress = usePreventDoublePress(async () => {
 *     await doSomething();
 *   });
 *
 * @param fn    A função a proteger (pode ser async ou sync).
 * @param delay Tempo mínimo (ms) entre execuções. Padrão: 0 (só bloqueia
 *              enquanto a promise não resolver). Passe um valor como 800
 *              para throttle baseado em tempo mesmo em funções síncronas.
 */
export function usePreventDoublePress<T extends unknown[]>(
  fn: (...args: T) => Promise<void> | void,
  delay = 1000,
): (...args: T) => void {
  const pendingRef = useRef(false);
  const lastCallRef = useRef(0);

  return useCallback(
    (...args: T) => {
      const now = Date.now();

      // Bloqueia se já está rodando OU se o intervalo mínimo não passou
      if (pendingRef.current || now - lastCallRef.current < delay) {
        return;
      }

      lastCallRef.current = now;
      pendingRef.current = true;

      const result = fn(...args);

      if (result instanceof Promise) {
        result.finally(() => {
          pendingRef.current = false;
        });
      } else {
        // Para funções síncronas, libera após o delay (ou imediatamente)
        if (delay > 0) {
          setTimeout(() => {
            pendingRef.current = false;
          }, delay);
        } else {
          pendingRef.current = false;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn, delay],
  );
}
