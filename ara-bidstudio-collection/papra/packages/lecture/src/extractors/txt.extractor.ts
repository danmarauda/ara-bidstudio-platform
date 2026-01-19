import { defineTextExtractor } from '../extractors.models';

export const txtExtractorDefinition = defineTextExtractor({
  name: 'text',
  mimeTypes: [
    'text/*',
    'application/json',
    'application/xml',
    'application/javascript',
    'application/typescript',
    'application/graphql',
    'application/markdown',
    'application/yaml',
  ],
  extract: async ({ arrayBuffer }) => {
    const text = new TextDecoder().decode(arrayBuffer);

    return { content: text };
  },
});
