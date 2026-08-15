import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { speakAndWait, stopSpeaking } from "../services/speech.service";
import { useAccessibility } from "../contexts/AccessibilityContext";

const spokenKeys = new Set<string>();

export function useAutoSpeakOnce(key: string, message: string, forceSpeak: boolean = false) {
  const { autoRead } = useAccessibility();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      if ((!autoRead && !forceSpeak) || !message.trim()) {
        return;
      }

      if (spokenKeys.has(key)) {
        return;
      }

      spokenKeys.add(key);
      setIsSpeaking(true);

      const timeoutId = setTimeout(() => {
        if (isMounted) {
          speakAndWait(message).finally(() => {
            if (isMounted) setIsSpeaking(false);
          });
        }
      }, 350);

      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
        stopSpeaking();
      };
    }, [key, message, autoRead, forceSpeak]),
  );

  return { isSpeaking };
}
