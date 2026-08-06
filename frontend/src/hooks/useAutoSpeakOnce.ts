import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { speakAndWait, stopSpeaking } from "../services/speech.service";
import { useAccessibility } from "../contexts/AccessibilityContext";

const spokenKeys = new Set<string>();

export function useAutoSpeakOnce(key: string, message: string) {
  const { autoRead } = useAccessibility();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      if (!autoRead || !message.trim()) {
        return;
      }

      if (spokenKeys.has(key)) {
        return;
      }

      spokenKeys.add(key);
      setIsSpeaking(true);

      speakAndWait(message).finally(() => {
        if (isMounted) setIsSpeaking(false);
      });

      return () => {
        isMounted = false;
        stopSpeaking();
      };
    }, [key, message, autoRead]),
  );

  return { isSpeaking };
}
