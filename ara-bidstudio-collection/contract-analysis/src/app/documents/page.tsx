'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function DocumentList() {
  const documents = useQuery(api.documents.queries.getDocuments, { organizationId: undefined });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState('');
  
  const uploadDocument = useMutation(api.documents.mutations.uploadDocument);
  
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const documentId = await uploadDocument({
        title,
        description,
        fileName,
        fileSize: fileData.length,
        page_count: 1,
        fileData,
      });
      console.log('Document uploaded with ID:', documentId);
      // Reset form
      setTitle('');
      setDescription('');
      setFileName('');
      setFileData('');
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };
  
  if (documents === undefined) {
    return <div>Loading documents...</div>;
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Document Analysis Platform</h1>
      
      <form onSubmit={handleUpload} className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Upload New Document</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">File Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">File Data (Base64)</label>
            <textarea
              value={fileData}
              onChange={(e) => setFileData(e.target.value)}
              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
              placeholder="Paste base64 encoded file data here"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Upload Document
          </button>
        </div>
      </form>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Documents</h2>
        {documents.length === 0 ? (
          <p>No documents found. Upload one to get started!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((document: any) => (
              <div key={document._id.toString()} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{document.title}</h3>
                <p className="text-sm text-gray-600">{document.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {document.fileName} ({document.fileSize} bytes)
                </p>
                <p className="text-xs text-gray-500">
                  Pages: {document.page_count} | Uploaded: {document.createdAt}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}