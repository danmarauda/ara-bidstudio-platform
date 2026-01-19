import React from "react";
import { useReactiveVar } from "@apollo/client";
import { MetaTags } from "../seo/MetaTags";
import { ModernLoadingDisplay } from "../widgets/ModernLoadingDisplay";
import { ModernErrorDisplay } from "../widgets/ModernErrorDisplay";
import { ErrorBoundary } from "../widgets/ErrorBoundary";
import { openedExtract, routeLoading, routeError } from "../../graphql/cache";
import { Extracts } from "../../views/Extracts";

/**
 * ExtractLandingRoute - Handles extract routes with explicit /e/ prefix
 *
 * Route pattern:
 * - /e/:userIdent/:extractId (extract by ID, slugs not yet supported)
 *
 * This component is a DUMB CONSUMER - it just reads state set by CentralRouteManager.
 */
export const ExtractLandingRoute: React.FC = () => {
  // Read state from reactive vars (set by CentralRouteManager)
  const extract = useReactiveVar(openedExtract);
  const loading = useReactiveVar(routeLoading);
  const error = useReactiveVar(routeError);

  console.log("[ExtractLandingRoute] 🔄 Render triggered", {
    hasExtract: !!extract,
    loading,
    hasError: !!error,
  });

  if (loading) {
    return <ModernLoadingDisplay type="extract" size="large" />;
  }

  if (error || !extract) {
    return (
      <ModernErrorDisplay type="extract" error={error || "Extract not found"} />
    );
  }

  return (
    <ErrorBoundary>
      <MetaTags
        title={extract.name || "Extract"}
        description={`Extract: ${extract.name}`}
        entity={extract}
        entityType="extract"
      />
      <Extracts />
    </ErrorBoundary>
  );
};

export default ExtractLandingRoute;
