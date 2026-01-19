import React from "react";
import { useReactiveVar } from "@apollo/client";
import { Corpuses } from "../../views/Corpuses";
import { MetaTags } from "../seo/MetaTags";
import { ModernLoadingDisplay } from "../widgets/ModernLoadingDisplay";
import { ModernErrorDisplay } from "../widgets/ModernErrorDisplay";
import { ErrorBoundary } from "../widgets/ErrorBoundary";
import { openedCorpus, routeLoading, routeError } from "../../graphql/cache";

/**
 * CorpusLandingRoute - Handles corpus routes with explicit /c/ prefix
 *
 * Route pattern:
 * - /c/:userIdent/:corpusIdent
 *
 * Query parameters (URL-driven state) - managed by CentralRouteManager:
 * - ?analysis=id1,id2 - Comma-separated analysis IDs to filter/display
 * - ?extract=id1,id2 - Comma-separated extract IDs to filter/display
 *
 * This component is now a DUMB CONSUMER - it just reads state set by CentralRouteManager.
 */
export const CorpusLandingRoute: React.FC = () => {
  // Read state from reactive vars (set by CentralRouteManager)
  const corpus = useReactiveVar(openedCorpus);
  const loading = useReactiveVar(routeLoading);
  const error = useReactiveVar(routeError);

  if (loading) {
    return <ModernLoadingDisplay type="corpus" size="large" />;
  }

  if (error) {
    return <ModernErrorDisplay type="corpus" error={error} />;
  }

  return (
    <ErrorBoundary>
      <MetaTags
        title={corpus?.title}
        description={corpus?.description}
        entity={corpus}
        entityType="corpus"
      />
      <Corpuses />
    </ErrorBoundary>
  );
};

export default CorpusLandingRoute;
