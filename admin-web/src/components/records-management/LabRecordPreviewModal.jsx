import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { buildMediaUrl } from "../../utils/runtimeUrls";

const LabRecordPreviewModal = ({ isOpen, onClose, selectedRecord, onEdit }) => {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const isDraftRecord = String(selectedRecord?.recordStatus || "").toLowerCase() === "draft";
  const draftPreviewHtml = selectedRecord?.editorHtml || "";

  const resolveRecordPreviewUrl = (record) => {
    if (!record) return "";

    const isDraft = String(record.recordStatus || "").toLowerCase() === "draft";
    if (isDraft) return "";

    if (record.filePath && /^https?:\/\//i.test(record.filePath)) {
      return record.filePath;
    }

    if (record.filePath && record.filePath.startsWith("/")) {
      return buildMediaUrl(record.filePath);
    }

    const fileToken = record.storedName || record.fileName || (record.fileID ? String(record.fileID) : null);
    if (fileToken) {
      return buildMediaUrl(`/api/admin/pet-records/file/${encodeURIComponent(fileToken)}`);
    }

    return "";
  };

  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      setError(false);
      setPdfPreviewUrl(null);
      return;
    }

    if (isDraftRecord) {
      setLoading(false);
      setError(false);
      setPdfPreviewUrl(null);
      return;
    }

    setLoading(false);
    setError(false);
    setPdfPreviewUrl(resolveRecordPreviewUrl(selectedRecord) || null);
  }, [isOpen, selectedRecord]);

  const handleDownload = () => {
    if (isDraftRecord) {
      return;
    }

    if (pdfPreviewUrl) {
      const link = document.createElement('a');
      link.href = pdfPreviewUrl;
      link.download = selectedRecord.originalName || selectedRecord.fileName || 'document.pdf';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isOpen || !selectedRecord) return null;

  const fileName = isDraftRecord
    ? `${selectedRecord.recordTitle || 'Untitled'} (Draft Preview)`
    : (selectedRecord.originalName || selectedRecord.fileName || `${selectedRecord.recordTitle || 'record'}.pdf`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-[#181818] rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">
            {fileName}
          </h3>
          <button
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p>Loading PDF...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-4">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-center mb-2">Failed to load PDF</p>
              <button
                onClick={() => {
                  const retryUrl = resolveRecordPreviewUrl(selectedRecord);
                  if (retryUrl) {
                    setPdfPreviewUrl(retryUrl);
                    setError(false);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : isDraftRecord ? (
            draftPreviewHtml ? (
              <div className="h-full w-full overflow-y-auto overflow-x-hidden p-2 bg-gray-100 dark:bg-[#101010]">
                <div
                  className="w-full max-w-[794px] bg-white text-gray-800 shadow-md mt-2 mx-auto p-8 min-h-[1123px] overflow-hidden"
                >
                  <div dangerouslySetInnerHTML={{ __html: draftPreviewHtml }} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <p>Draft has no content yet.</p>
              </div>
            )
          ) : pdfPreviewUrl ? (
            <iframe
              src={pdfPreviewUrl}
              title={fileName}
              className="w-full h-full"
              onError={() => setError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No file available</p>
            </div>
          )}
        </div>

        {pdfPreviewUrl && !error && !isDraftRecord && (
          <div className="flex justify-end mt-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Download
            </button>
          </div>
        )}

        {isDraftRecord && (
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                if (onEdit) {
                  onEdit(selectedRecord);
                }
              }}
              className="px-4 py-2 bg-[#5EE6FE] text-white rounded-lg hover:bg-[#40c6e3] transition-colors text-sm font-semibold"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabRecordPreviewModal;