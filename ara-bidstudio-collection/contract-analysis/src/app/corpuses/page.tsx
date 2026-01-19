'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function CorpusesPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const corpuses = useQuery(api.corpuses.queries.getCorpuses, {});
  const createCorpus = useMutation(api.corpuses.mutations.createCorpus);

  const handleCreateCorpus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCorpus({ name, description });
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Error creating corpus:', error);
    }
  };

  if (corpuses === undefined) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Corpuses</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Document Corpuses</h1>
      
      <form onSubmit={handleCreateCorpus} className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Create New Corpus</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Create Corpus
          </button>
        </div>
      </form>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Your Corpuses</h2>
        {corpuses.length === 0 ? (
          <p>No corpuses found. Create one to get started!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {corpuses.map((corpus: any) => (
              <div key={corpus._id.toString()} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{corpus.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{corpus.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Created: {new Date(corpus.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}






