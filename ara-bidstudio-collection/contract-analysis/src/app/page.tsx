import Link from 'next/link';

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center sm:text-left">
          Contract Analysis Platform
        </h1>
        <p className="text-lg text-gray-600 mb-8 text-center sm:text-left">
          Modern contract analysis with real-time collaboration, AI-powered processing, 
          and intelligent annotation capabilities.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <Link href="/documents" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow dark:bg-gray-800 dark:hover:bg-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 dark:text-white">
              Documents
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Upload, manage, and process your contract documents with docling-granite.
            </p>
          </Link>
          
          <Link href="/annotations" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow dark:bg-gray-800 dark:hover:bg-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 dark:text-white">
              Annotations
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Create and manage intelligent text annotations with real-time collaboration.
            </p>
          </Link>
          
          <Link href="/corpuses" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow dark:bg-gray-800 dark:hover:bg-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 dark:text-white">
              Corpuses
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Group documents into analysis corpuses for batch processing and insights.
            </p>
          </Link>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://docs.convex.dev"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div aria-hidden className="w-4 h-4 bg-blue-500 rounded-full"></div>
          Convex Docs
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://langflow.wiki"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div aria-hidden className="w-4 h-4 bg-green-500 rounded-full"></div>
          Langflow Docs
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://mastra.ai/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div aria-hidden className="w-4 h-4 bg-purple-500 rounded-full"></div>
          Mastra Docs
        </a>
      </footer>
    </div>
  );
}
