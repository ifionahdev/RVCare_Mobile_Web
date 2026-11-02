import { useState, useEffect } from "react";
import { buildMediaUrl } from "../../utils/runtimeUrls";

const RightPanel = ({ 
  activeTab, 
  selectedOwner, 
  selectedPet, 
  selectedRecord, 
  setIsPdfModalOpen 
}) => {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(false);
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
    if (!selectedRecord || isDraftRecord) {
      setPdfPreviewUrl(null);
      setLoadingPdf(false);
      setPdfError(false);
      return;
    }

    const previewUrl = resolveRecordPreviewUrl(selectedRecord);
    setPdfError(false);
    setPdfPreviewUrl(previewUrl || null);
    setLoadingPdf(false);
  }, [selectedRecord]);

  // Handle PDF iframe error
  const handlePdfError = () => {
    console.error('Failed to load PDF in iframe');
    setPdfError(true);
  };

  // Handle PDF iframe load
  const handlePdfLoad = () => {
    setPdfError(false);
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Format phone number
  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return phone;
  };

  const resolvePetImage = (pet) => {
    if (!pet) return "/images/sad-dog.png";
    if (pet.imageUrl && /^https?:\/\//i.test(pet.imageUrl)) return pet.imageUrl;
    if (pet.imageUrl && pet.imageUrl.startsWith("/")) return buildMediaUrl(pet.imageUrl);
    if (pet.image && /^https?:\/\//i.test(pet.image)) return pet.image;
    if (pet.image && pet.image.startsWith("/")) return buildMediaUrl(pet.image);
    if (pet.imageUrl) return pet.imageUrl;
    if (pet.imageName) return buildMediaUrl(`/api/pets/images/${encodeURIComponent(pet.imageName)}`);
    return "/images/sad-dog.png";
  };

  return (
    <div className="w-1/3 bg-white dark:bg-[#181818] rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 p-6 flex flex-col min-h-0 overflow-y-auto">
      {/* Pet Owners Details */}
      {activeTab === "Pet Owners" && (
        <div className="flex-1 flex flex-col min-h-0">
          {selectedOwner ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                  {selectedOwner.firstName} {selectedOwner.lastName}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">ID: {selectedOwner.accId || selectedOwner.id}</span>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Email</span>
                  <span className="text-gray-800 dark:text-gray-200 text-right max-w-[60%] break-words">
                    {selectedOwner.email || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Phone</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {formatPhone(selectedOwner.contactNo || selectedOwner.phone)}
                  </span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Address</span>
                  <span className="text-gray-800 dark:text-gray-200 text-right max-w-[60%]">
                    {selectedOwner.address || 'No address provided'}
                  </span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Gender</span>
                  <span className="text-gray-800 dark:text-gray-200 capitalize">
                    {selectedOwner.gender?.toLowerCase() || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Date of Birth</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {formatDate(selectedOwner.dateOfBirth || selectedOwner.dateOfBIrth)}
                  </span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Pets</span>
                  <span className="text-gray-800 dark:text-gray-200 text-right max-w-[60%]">
                    {selectedOwner?.pets?.length
                      ? selectedOwner.pets.map(p => p.petName || p.name).join(", ")
                      : "No pets registered"}
                  </span>
                </div>
                
                <div className="flex justify-between pt-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Account Created</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {formatDate(selectedOwner.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-full text-gray-400 dark:text-gray-500 p-4 text-center">
              <i className="fas fa-user text-4xl mb-3 text-gray-300"></i>
              <p className="text-lg font-medium mb-2">No Owner Selected</p>
              <p className="text-sm">Select an owner from the list to view details</p>
            </div>
          )}
        </div>
      )}

      {/* Pets Details */}
      {activeTab === "Pets" && (
        <div className="flex-1 flex flex-col min-h-0">
          {selectedPet ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={resolvePetImage(selectedPet)}
                  alt={selectedPet.petName || selectedPet.name}
                  className="w-20 h-20 rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
                  onError={(e) => {
                    e.target.src = "/images/sad-dog.png";
                  }}
                />
                <div className="flex flex-col">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    {selectedPet.petName || selectedPet.name}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ID: {selectedPet.petID || selectedPet.id}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Owner</span>
                  <span className="text-gray-800 dark:text-gray-200 text-right max-w-[60%]">
                    {selectedPet.owner || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Breed</span>
                  <span className="text-gray-800 dark:text-gray-200 capitalize">
                    {selectedPet.breed || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Species</span>
                  <span className="text-gray-800 dark:text-gray-200 capitalize">
                    {selectedPet.species || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Age</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {selectedPet.age || calculateAge(selectedPet.dateOfBirth) || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Gender</span>
                  <span className="text-gray-800 dark:text-gray-200 capitalize">
                    {selectedPet.petGender || selectedPet.gender || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Weight</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {(() => {
                      const rawWeight = selectedPet.weight_kg || selectedPet.weight;
                      if (!rawWeight) return 'N/A';
                      const normalizedWeight = String(rawWeight).trim();
                      return /kg$/i.test(normalizedWeight) ? normalizedWeight : `${normalizedWeight} kg`;
                    })()}
                  </span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Color</span>
                  <span className="text-gray-800 dark:text-gray-200 capitalize">
                    {selectedPet.color || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Date of Birth</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {formatDate(selectedPet.dateOfBirth || selectedPet.petDateOfBirth)}
                  </span>
                </div>
                
                <div className="flex justify-between pt-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Notes</span>
                  <span className="text-gray-800 dark:text-gray-200 text-right max-w-[60%]">
                    {selectedPet.note || 'No notes provided'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-full text-gray-400 dark:text-gray-500 p-4 text-center">
              <i className="fas fa-paw text-4xl mb-3 text-gray-300"></i>
              <p className="text-lg font-medium mb-2">No Pet Selected</p>
              <p className="text-sm">Select a pet from the list to view details</p>
            </div>
          )}
        </div>
      )}

      {/* Lab/Medical Records Details */}
      {activeTab === "Lab/Medical Records" && (
        <div className="flex-1 flex flex-col min-h-0">
          {selectedRecord ? (
            <div className="flex flex-col flex-1 gap-4">
              {/* Record Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {selectedRecord.petName} - {selectedRecord.type}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedRecord.recordTitle}
                  </p>
                </div>
                <button
                  onClick={() => setIsPdfModalOpen(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
                  title="Open in full screen"
                  disabled={isDraftRecord ? false : (!pdfPreviewUrl || loadingPdf)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 ${(isDraftRecord ? false : (!pdfPreviewUrl || loadingPdf)) ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3H5a2 2 0 00-2 2v3m0 8v3a2 2 0 002 2h3m8-16h3a2 2 0 012 2v3m0 8v3a2 2 0 01-2 2h-3" />
                  </svg>
                </button>
              </div>

              {/* Record Details */}
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Uploaded:</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {isDraftRecord ? 'Draft' : formatDate(selectedRecord.uploadedOn)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600 dark:text-gray-400">File:</span>
                  <span className="text-gray-800 dark:text-gray-200 text-right max-w-[60%] break-words">
                    {isDraftRecord
                      ? 'Draft Preview (temporary)'
                      : (selectedRecord.originalName || selectedRecord.fileName || selectedRecord.filePath)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Owner:</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {selectedRecord.owner || 'N/A'}
                  </span>
                </div>
              </div>

              {/* PDF Preview */}
              <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-[#1B1B1B]">
                {isDraftRecord ? (
                  draftPreviewHtml ? (
                    <div className="h-full w-full overflow-y-auto overflow-x-hidden p-2 bg-gray-100 dark:bg-[#101010]">
                      <div
                        className="w-full max-w-[794px] bg-white text-gray-800 shadow-md mt-2 mx-auto p-8 min-h-[1123px] overflow-hidden"
                      >
                        <div dangerouslySetInnerHTML={{ __html: draftPreviewHtml }} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-4">
                      <p className="text-center">Draft has no content yet.</p>
                    </div>
                  )
                ) : loadingPdf ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-4">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-center">Loading PDF...</p>
                  </div>
                ) : pdfError ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-4">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-center mb-2">Failed to load PDF</p>
                    <button 
                      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      onClick={() => {
                        const retryUrl = resolveRecordPreviewUrl(selectedRecord);
                        if (retryUrl) {
                          setPdfPreviewUrl(retryUrl);
                          setPdfError(false);
                        }
                      }}
                    >
                      Retry
                    </button>
                  </div>
                ) : pdfPreviewUrl ? (
                  <iframe
                    key={pdfPreviewUrl}
                    src={pdfPreviewUrl}
                    title={selectedRecord.originalName || selectedRecord.fileName}
                    className="w-full h-full min-h-[400px]"
                    onError={handlePdfError}
                    onLoad={handlePdfLoad}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-4">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-center">No file available</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-full text-gray-400 dark:text-gray-500 p-4 text-center">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium mb-2">No Record Selected</p>
              <p className="text-sm">Select a medical record from the list to view details</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age > 0 ? `${age} year${age !== 1 ? 's' : ''}` : 'Less than 1 year';
  } catch {
    return null;
  }
};

export default RightPanel;