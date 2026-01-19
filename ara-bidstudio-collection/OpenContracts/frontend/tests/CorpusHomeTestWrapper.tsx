import React, { ReactNode } from "react";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { InMemoryCache } from "@apollo/client";
import { Provider } from "jotai";
import { CorpusHome } from "../src/components/corpuses/CorpusHome";
import { CorpusType } from "../src/types/graphql-api";
import { relayStylePagination } from "@apollo/client/utilities";
import { mergeArrayByIdFieldPolicy } from "../src/graphql/cache";

// Minimal cache matching production cache configuration
const createTestCache = () =>
  new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          corpuses: relayStylePagination(),
          documents: relayStylePagination(),
        },
      },
      CorpusType: {
        keyFields: ["id"],
        fields: {
          // CRITICAL: Handle DocumentTypeConnection properly to prevent infinite loops
          documents: relayStylePagination(),
        },
      },
    },
  });

interface Props {
  mocks: ReadonlyArray<MockedResponse>;
  corpus: CorpusType;
}

export const CorpusHomeTestWrapper: React.FC<Props> = ({ mocks, corpus }) => {
  // Default stats matching the mock data in CorpusHome.ct.tsx
  const stats = {
    totalDocs: 3,
    totalAnnotations: 5,
    totalAnalyses: 0,
    totalExtracts: 0,
  };

  return (
    <Provider>
      <MockedProvider mocks={mocks} cache={createTestCache()} addTypename>
        <CorpusHome
          corpus={corpus}
          onEditDescription={() => {}}
          stats={stats}
          statsLoading={false}
        />
      </MockedProvider>
    </Provider>
  );
};
