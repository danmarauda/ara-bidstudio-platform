'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

export default function AnnotationsPage() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  
  const documents = useQuery(api.documents.queries.getDocuments, { organizationId: undefined });
  const annotations = selectedDocumentId 
    ? useQuery(api.annotations.queries.getAnnotations, { documentId: selectedDocumentId as Id<"documents"> })
    : undefined;

  if (documents === undefined) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Annotations</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Document Annotations</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Document</label>
        <select
          value={selectedDocumentId}
          onChange={(e) => setSelectedDocumentId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border rounded-md"
        >
          <option value="">-- Select a document --</option>
          {documents.map((doc: any) => (
            <option key={doc._id.toString()} value={doc._id.toString()}>
              {doc.title}
            </option>
          ))}
        </select>
      </div>

      {selectedDocumentId && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Annotations</h2>
          {annotations === undefined ? (
            <div>Loading annotations...</div>
          ) : annotations.length === 0 ? (
            <p>No annotations found for this document.</p>
          ) : (
            <div className="space-y-2">
              {annotations.map((annotation: any) => (
                <div key={annotation._id.toString()} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold">{annotation.label}</span>
                      <span className="ml-2 text-sm text-gray-600">({annotation.type})</span>
                    </div>
                    <span className="text-sm text-gray-500">Page {annotation.page}</span>
                  </div>
                  <div 
                    className="mt-2 h-4 rounded"
                    style={{ backgroundColor: annotation.color, opacity: 0.3 }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedDocumentId && documents.length === 0 && (
        <p>No documents available. Upload a document first to create annotations.</p>
      )}
    </div>
  );
}

