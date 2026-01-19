// src/components/GoogleDriveSearch/GoogleDriveSearch.tsx ------------------------
import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  FileText,
  Image,
  FileSpreadsheet,
  Video,
  Star,
  Share2,
  Clock,
  X,
  ChevronDown,
  ExternalLink,
  Folder,
  MoreVertical,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface GoogleDriveFile {
  _id: Id<"googleDriveFiles">;
  fileId: string;
  name: string;
  mimeType: string;
  size?: number;
  createdTime: number;
  modifiedTime: number;
  webViewLink?: string;
  webContentLink?: string;
  owners: string[];
  shared: boolean;
  starred: boolean;
  trashed: boolean;
  parents: string[];
  contentExtracted?: boolean;
  contentSummary?: string;
  extractedAt?: number;
  tags?: string[];
  lastAccessedAt?: number;
  accessCount?: number;
}

interface SearchFilters {
  mimeType?: string;
  dateFrom?: number;
  dateTo?: number;
  owners?: string[];
  shared?: boolean;
  starred?: boolean;
  trashed?: boolean;
}

const MIME_TYPE_OPTIONS = [
  { value: "", label: "All Files" },
  { value: "application/vnd.google-apps.document", label: "Google Docs" },
  { value: "application/vnd.google-apps.spreadsheet", label: "Google Sheets" },
  { value: "application/vnd.google-apps.presentation", label: "Google Slides" },
  { value: "application/pdf", label: "PDF" },
  { value: "text/plain", label: "Text Files" },
  { value: "image/jpeg", label: "JPEG Images" },
  { value: "image/png", label: "PNG Images" },
  { value: "video/mp4", label: "MP4 Videos" },
];

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes("document"))
    return <FileText className="w-4 h-4 text-blue-500" />;
  if (mimeType.includes("spreadsheet"))
    return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
  if (mimeType.includes("presentation"))
    return <FileText className="w-4 h-4 text-orange-500" />;
  if (mimeType.includes("image"))
    return <Image className="w-4 h-4 text-purple-500" />;
  if (mimeType.includes("video"))
    return <Video className="w-4 h-4 text-red-500" />;
  if (mimeType.includes("pdf"))
    return <FileText className="w-4 h-4 text-red-500" />;
  return <FileText className="w-4 h-4 text-gray-500" />;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "Unknown size";
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const GoogleDriveSearch: React.FC<{
  onFileSelect?: (file: GoogleDriveFile) => void;
  compact?: boolean;
  variant?: "default" | "embedded" | "modal";
}> = ({ onFileSelect, compact = false, variant = "default" }) => {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<GoogleDriveFile[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(
    null,
  );
  const [showFilePreview, setShowFilePreview] = useState(false);

  // Convex queries and mutations
  const recentFiles = useQuery(api.googleDrive.getRecentFiles, { limit: 10 });
  const starredFiles = useQuery(api.googleDrive.getStarredFiles, { limit: 10 });
  const sharedFiles = useQuery(api.googleDrive.getSharedFiles, { limit: 10 });
  const searchHistory = useQuery(api.googleDrive.getSearchHistory, {
    limit: 5,
  });

  const liveSearch = useMutation(api.googleDrive.liveSearchGoogleDrive);
  const getFileContent = useMutation(api.googleDrive.getFileContent);

  const handleSearch = useCallback(
    async (isLive: boolean = true) => {
      if (
        !query.trim() &&
        !Object.keys(filters).some(
          (key) => filters[key as keyof SearchFilters] !== undefined,
        )
      ) {
        return;
      }

      setLoading(true);
      try {
        let results;

        if (isLive) {
          // Live search from Google Drive API
          const response = await liveSearch({
            query: query.trim() || undefined,
            ...filters,
            pageSize: 20,
          });
          results = response.files;
        } else {
          // Cached search from database
          results = await fetch("/api/google-drive/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, ...filters }),
          })
            .then((res) => res.json())
            .then((data) => data.files);
        }

        setSearchResults(results);
        setHasSearched(true);
      } catch (error) {
        console.error("Search failed:", error);
        // Could show toast notification here
      } finally {
        setLoading(false);
      }
    },
    [query, filters, liveSearch],
  );

  const handleFileClick = async (file: GoogleDriveFile) => {
    setSelectedFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
    if (!compact) {
      setShowFilePreview(true);
    }
  };

  const handleFileContent = async (file: GoogleDriveFile) => {
    try {
      const content = await getFileContent({
        fileId: file.fileId,
        mimeType: file.mimeType,
      });
      console.log("File content:", content);
      // Could display content in a modal or side panel
    } catch (error) {
      console.error("Failed to get file content:", error);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setQuery("");
    setSearchResults([]);
    setHasSearched(false);
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const renderFileCard = (file: GoogleDriveFile) => (
    <div
      key={file._id}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleFileClick(file)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getFileIcon(file.mimeType)}
          <h3 className="font-medium text-gray-900 truncate flex-1">
            {file.name}
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          {file.starred && (
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
          )}
          {file.shared && <Share2 className="w-4 h-4 text-blue-500" />}
        </div>
      </div>

      <div className="text-sm text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>Modified: {formatDate(file.modifiedTime)}</span>
          <span>{formatFileSize(file.size)}</span>
        </div>
        <div className="flex justify-between">
          <span>Owner: {file.owners[0]}</span>
          {file.accessCount && <span>Accessed {file.accessCount} times</span>}
        </div>
      </div>

      {file.contentSummary && (
        <div className="mt-2 text-sm text-gray-600 line-clamp-2">
          {file.contentSummary}
        </div>
      )}

      <div className="mt-3 flex justify-between items-center">
        <div className="flex space-x-2">
          {file.webViewLink && (
            <a
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open</span>
            </a>
          )}
          {file.contentExtracted && (
            <button
              className="text-green-600 hover:text-green-800 text-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleFileContent(file);
              }}
            >
              View Content
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderSearchBar = () => (
    <div className="flex space-x-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search Google Drive..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`px-4 py-2 rounded-lg border ${showFilters ? "bg-blue-50 border-blue-300" : "border-gray-300"} hover:bg-gray-50`}
      >
        <Filter className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleSearch()}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </div>
  );

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Type
            </label>
            <select
              value={filters.mimeType || ""}
              onChange={(e) =>
                updateFilter("mimeType", e.target.value || undefined)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {MIME_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={
                filters.dateFrom
                  ? new Date(filters.dateFrom).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                updateFilter(
                  "dateFrom",
                  e.target.value
                    ? new Date(e.target.value).getTime()
                    : undefined,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={
                filters.dateTo
                  ? new Date(filters.dateTo).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                updateFilter(
                  "dateTo",
                  e.target.value
                    ? new Date(e.target.value).getTime()
                    : undefined,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.starred || false}
                onChange={(e) =>
                  updateFilter("starred", e.target.checked || undefined)
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Starred</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.shared || false}
                onChange={(e) =>
                  updateFilter("shared", e.target.checked || undefined)
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Shared</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Clear Filters
          </button>
        </div>
      </div>
    );
  };

  const renderQuickAccess = () => (
    <div className="space-y-6">
      {recentFiles && recentFiles.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Recent Files
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentFiles.map(renderFileCard)}
          </div>
        </div>
      )}

      {starredFiles && starredFiles.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Starred Files
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {starredFiles.map(renderFileCard)}
          </div>
        </div>
      )}

      {sharedFiles && sharedFiles.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Share2 className="w-5 h-5 mr-2" />
            Shared Files
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sharedFiles.map(renderFileCard)}
          </div>
        </div>
      )}

      {searchHistory && searchHistory.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Recent Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((history, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(history.query);
                  handleSearch();
                }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 text-sm"
              >
                {history.query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className="space-y-4">
        {renderSearchBar()}
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {searchResults.slice(0, 5).map(renderFileCard)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${variant === "modal" ? "p-6" : ""}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Google Drive Search
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Powered by Google Drive API</span>
        </div>
      </div>

      {renderSearchBar()}
      {renderFilters()}

      {!hasSearched &&
        !query &&
        Object.keys(filters).length === 0 &&
        renderQuickAccess()}

      {hasSearched && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Search Results ({searchResults.length})
            </h3>
            {searchResults.length === 0 && (
              <p className="text-gray-500">
                No files found matching your criteria.
              </p>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map(renderFileCard)}
            </div>
          )}
        </div>
      )}

      {/* File Preview Modal */}
      {showFilePreview && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getFileIcon(selectedFile.mimeType)}
                  <h3 className="text-lg font-semibold">{selectedFile.name}</h3>
                </div>
                <button
                  onClick={() => setShowFilePreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type:</span>{" "}
                    {selectedFile.mimeType}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span>{" "}
                    {formatFileSize(selectedFile.size)}
                  </div>
                  <div>
                    <span className="font-medium">Modified:</span>{" "}
                    {formatDate(selectedFile.modifiedTime)}
                  </div>
                  <div>
                    <span className="font-medium">Owner:</span>{" "}
                    {selectedFile.owners[0]}
                  </div>
                </div>

                {selectedFile.contentSummary && (
                  <div>
                    <h4 className="font-medium mb-2">Content Summary</h4>
                    <p className="text-gray-600">
                      {selectedFile.contentSummary}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  {selectedFile.webViewLink && (
                    <a
                      href={selectedFile.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Open in Google Drive
                    </a>
                  )}
                  {selectedFile.contentExtracted && (
                    <button
                      onClick={() => handleFileContent(selectedFile)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Extract Full Content
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleDriveSearch;
