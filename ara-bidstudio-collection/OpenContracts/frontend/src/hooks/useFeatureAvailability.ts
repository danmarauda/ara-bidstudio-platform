import { useCallback, useMemo } from "react";
import { FEATURE_FLAGS, FeatureKey } from "../config/features";

export const useFeatureAvailability = (corpusId?: string) => {
  // Memoize the availability check function to prevent new function on every render
  const isFeatureAvailable = useCallback(
    (feature: FeatureKey): boolean => {
      const config = FEATURE_FLAGS[feature];
      return !config.requiresCorpus || Boolean(corpusId);
    },
    [corpusId]
  );

  // Memoize the status getter function
  const getFeatureStatus = useCallback(
    (feature: FeatureKey) => {
      const config = FEATURE_FLAGS[feature];
      const available = isFeatureAvailable(feature);

      return {
        available,
        config,
        message:
          !available && "disabledMessage" in config
            ? config.disabledMessage
            : undefined,
      };
    },
    [corpusId, isFeatureAvailable]
  );

  // Memoize the returned object to prevent new object identity on every render
  return useMemo(
    () => ({
      isFeatureAvailable,
      getFeatureStatus,
      hasCorpus: Boolean(corpusId),
    }),
    [isFeatureAvailable, getFeatureStatus, corpusId]
  );
};
