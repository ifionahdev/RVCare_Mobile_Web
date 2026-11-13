// components/records-management/UploadRecordModal.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, FileUp, Edit3 } from 'lucide-react';
import api from '../../api/axios';

const getPetAgeLabel = (pet) => {
  if (!pet) return 'Age unknown';
  if (pet.age && typeof pet.age === 'string' && pet.age.trim()) return pet.age;

  const rawDob = pet.dateOfBirth || pet.dob;
  if (!rawDob) return 'Age unknown';

  const birth = new Date(rawDob);
  if (Number.isNaN(birth.getTime())) return 'Age unknown';

  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years > 0) return `${years} yrs old`;
  if (months > 0) return `${months} mos old`;
  return `${Math.max(days, 0)} days old`;
};

const getPetSpeciesLabel = (pet) => {
  if (!pet) return 'Unknown species';
  return pet.species || pet.petType || 'Unknown species';
};

const UploadRecordModal = ({
  isOpen,
  onClose,
  pets,
  searchQuery,
  setSearchQuery,
  selectedPet,
  setSelectedPet,
  setSuccessMessage,
  setErrorMessage,
  refreshRecords,
  editingItem,
  onRecordUpdate // NEW: Add this prop
}) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('select'); // 'select', 'upload', 'create'
  const [formData, setFormData] = useState({
    recordTitle: '',
    labTypeID: '1' // Default to Lab Record
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [labTypes, setLabTypes] = useState([]);
  const [errorMessage, setLocalErrorMessage] = useState('');

  // Fetch lab types on component mount
  useEffect(() => {
    const fetchLabTypes = async () => {
      try {
        const response = await api.get('/admin/pet-records/lab-types');
        if (response.data.success) {
          setLabTypes(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching lab types:', error);
      }
    };
    
    if (isOpen) {
      fetchLabTypes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        // Populate form for editing
        setMode('upload');
        setFormData({
          recordTitle: editingItem.recordTitle || '',
          labTypeID: editingItem.labTypeID?.toString() || '1'
        });
        setFile(null);
      } else {
        // Reset form for new upload
        setMode('select');
        setFormData({ recordTitle: '', labTypeID: '1' });
        setFile(null);
        setSelectedPet(null);
      }
    }
  }, [isOpen, editingItem, setSelectedPet]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setLocalErrorMessage('Please select a PDF file only.');
        e.target.value = '';
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setLocalErrorMessage('File size must be less than 10MB.');
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
      setLocalErrorMessage('');
    }
  };

  const handleUpload = async () => {
    // Validation for new record
    if (!editingItem && !selectedPet) {
      setLocalErrorMessage('Please select a pet.');
      return;
    }

    if (!formData.recordTitle.trim()) {
      setLocalErrorMessage('Record title is required.');
      return;
    }

    if (!file && !editingItem) {
      setLocalErrorMessage('Please select a PDF file to upload.');
      return;
    }

    setLoading(true);
    setLocalErrorMessage('');

    try {
      const uploadFormData = new FormData();
      
      if (editingItem) {
        // Editing existing record
        uploadFormData.append('recordTitle', formData.recordTitle);
        uploadFormData.append('labTypeID', formData.labTypeID);
        if (file) {
          uploadFormData.append('file', file);
        }

        const response = await api.put(`/admin/pet-records/${editingItem.id}`, uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          setSuccessMessage('Record updated successfully!');
          
          // NEW: Re-fetch the updated record to get fresh data
          try {
            const updatedResponse = await api.get(`/admin/pet-records/${editingItem.id}`);
            if (updatedResponse.data.success && onRecordUpdate) {
              onRecordUpdate(updatedResponse.data.data);
            }
          } catch (fetchError) {
            console.error('Error fetching updated record:', fetchError);
          }
          
          refreshRecords();
          onClose();
        }
      } else {
        // Creating new record - removed accID as it's not needed in backend
        uploadFormData.append('petID', selectedPet.petID);
        uploadFormData.append('recordTitle', formData.recordTitle);
        uploadFormData.append('labTypeID', formData.labTypeID);
        uploadFormData.append('file', file);

        const response = await api.post('/admin/pet-records/upload', uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          setSuccessMessage('Record uploaded successfully!');
          refreshRecords();
          onClose();
          // Reset selection after successful upload
          setSelectedPet(null);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setLocalErrorMessage(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to upload record. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ recordTitle: '', labTypeID: '1' });
    setFile(null);
    setSelectedPet(null);
    setLocalErrorMessage('');
    setMode('select');
    onClose();
  };

  const handleProceedToDocument = () => {
    if (!formData.recordTitle.trim()) {
      setLocalErrorMessage('Record title is required.');
      return;
    }

    if (!selectedPet) {
      setLocalErrorMessage('Please select a pet first.');
      return;
    }

    // Navigate to document editor with pet info and pre-filled title
    const petName = selectedPet.petName || selectedPet.name;
    navigate(`/admin/create-lab-document/${selectedPet.petID}/${encodeURIComponent(petName)}`, {
      state: {
        recordTitle: formData.recordTitle,
        labTypeID: formData.labTypeID,
        ownerName: selectedPet.owner || selectedPet.ownerName || 'N/A'
      }
    });
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 flex flex-col overflow-hidden shadow-2xl"
        style={{ width: mode === 'select' ? 'auto' : '900px', maxWidth: '90vw', maxHeight: mode === 'select' ? 'auto' : '85vh' }}>
        
        {/* Header with Close Button */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {editingItem ? 'Edit Medical Record' : (mode === 'select' ? 'Add Record' : mode === 'upload' ? 'Upload PDF' : 'Create Document')}
          </h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition disabled:opacity-50"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className={mode === 'select' ? '' : 'flex-1 overflow-y-auto'}>
          {mode === 'select' && (
            <div className="flex gap-8" style={{ minWidth: '600px' }}>
              {/* Pet Selection */}
              <div className="flex flex-col gap-3 flex-1">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Pet</h4>
                <input
                  type="text"
                  placeholder="Search pet or owner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1B1B1B] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50 transition"
                />
                <div className="max-h-[280px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {pets.filter(p =>
                    p.petName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.owner?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 ? (
                    <p className="text-gray-400 dark:text-gray-500 text-center p-4">No pets found</p>
                  ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {pets.filter(p =>
                        p.petName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.owner?.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map(pet => (
                        <li
                          key={pet.petID}
                          className={`p-3 cursor-pointer hover:bg-[#E5FBFF] dark:hover:bg-[#222] transition ${
                            selectedPet?.petID === pet.petID ? "bg-[#5EE6FE]/20 dark:bg-[#3BAFDA]/20" : ""
                          }`}
                          onClick={() => {
                            setSelectedPet(pet);
                            setLocalErrorMessage('');
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {pet.petName || pet.name}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {pet.owner}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {(pet.breed || 'Unknown breed')} • {getPetAgeLabel(pet)} • {getPetSpeciesLabel(pet)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Mode Selection */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">How would you like to add the record?</p>
                {!selectedPet && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">Select a pet to enable these options</p>
                )}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      if (selectedPet) {
                        setMode('upload');
                        setLocalErrorMessage('');
                      }
                    }}
                    disabled={!selectedPet}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg transition w-64 ${
                      selectedPet
                        ? "border-gray-200 dark:border-gray-700 hover:border-[#5EE6FE] hover:bg-[#5EE6FE]/5 cursor-pointer"
                        : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#0F0F0F] opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <FileUp size={20} className={`flex-shrink-0 ${
                      selectedPet ? "text-gray-600 dark:text-gray-400" : "text-gray-400 dark:text-gray-500"
                    }`} />
                    <div className="text-left">
                      <p className={`font-medium ${selectedPet ? "text-gray-800 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"}`}>
                        Upload PDF
                      </p>
                      <p className={`text-xs ${selectedPet ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-500"}`}>
                        Upload a PDF file
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      if (selectedPet) {
                        setMode('create');
                        setLocalErrorMessage('');
                      }
                    }}
                    disabled={!selectedPet}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg transition w-64 ${
                      selectedPet
                        ? "border-gray-200 dark:border-gray-700 hover:border-[#5EE6FE] hover:bg-[#5EE6FE]/5 cursor-pointer"
                        : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#0F0F0F] opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <Edit3 size={20} className={`flex-shrink-0 ${
                      selectedPet ? "text-gray-600 dark:text-gray-400" : "text-gray-400 dark:text-gray-500"
                    }`} />
                    <div className="text-left">
                      <p className={`font-medium ${selectedPet ? "text-gray-800 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"}`}>
                        Create Document
                      </p>
                      <p className={`text-xs ${selectedPet ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-500"}`}>
                        Write in editor
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === 'upload' && (
            <div className="flex flex-col gap-4">
              {/* Selected Pet Info */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {selectedPet?.petName || selectedPet?.name}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedPet?.owner}
                  </span>
                </div>
              </div>

              {/* Record Title */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Record Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="recordTitle"
                  value={formData.recordTitle}
                  onChange={handleInputChange}
                  placeholder="e.g. Vaccination Record, Blood Test Results, X-ray Report"
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1B1B1B] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50 transition"
                />
              </div>

              {/* Type Selector */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Record Type <span className="text-red-500">*</span>
                </label>
                <select 
                  name="labTypeID"
                  value={formData.labTypeID}
                  onChange={handleInputChange}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1B1B1B] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50 transition"
                >
                  {labTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PDF File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1B1B1B] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#5EE6FE] file:text-gray-800 hover:file:bg-[#40c6e3] transition"
                />
                {file && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Only PDF files allowed (max 10MB)
                </p>
              </div>
            </div>
          )}

          {mode === 'create' && (
            <div className="flex flex-col gap-4">
              {/* Selected Pet Info */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {selectedPet?.petName || selectedPet?.name}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedPet?.owner}
                  </span>
                </div>
              </div>

              {/* Record Title */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Record Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="recordTitle"
                  value={formData.recordTitle}
                  onChange={handleInputChange}
                  placeholder="e.g. Vaccination Record, Blood Test Results, Checkup Notes"
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1B1B1B] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50 transition"
                />
              </div>

              {/* Type Selector */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Record Type <span className="text-red-500">*</span>
                </label>
                <select 
                  name="labTypeID"
                  value={formData.labTypeID}
                  onChange={handleInputChange}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1B1B1B] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50 transition"
                >
                  {labTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                ℹ️ You'll be able to format your document with text styles, lists, images, and tables on the next page.
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-6">
          {mode !== 'select' && (
            <button
              onClick={() => setMode('select')}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222] transition disabled:opacity-50"
            >
              Back
            </button>
          )}
          
          {mode === 'upload' && (
            <button
              onClick={handleUpload}
              disabled={loading || !selectedPet || !file || !formData.recordTitle.trim()}
              className="px-6 py-2 rounded-lg bg-[#5EE6FE] hover:bg-[#40c6e3] text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <FileUp size={16} />
                  Upload Record
                </>
              )}
            </button>
          )}

          {mode === 'create' && (
            <button
              onClick={handleProceedToDocument}
              disabled={loading || !selectedPet || !formData.recordTitle.trim()}
              className="px-6 py-2 rounded-lg bg-[#5EE6FE] hover:bg-[#40c6e3] text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Edit3 size={16} />
              Proceed to Editor
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadRecordModal;