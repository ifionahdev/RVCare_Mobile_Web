import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, Save, Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Table2, Palette, RotateCcw, RotateCw, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../api/axios';

const sanitizePdfFileName = (value) =>
  String(value || 'medical-record')
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 80) || 'medical-record';

const createPdfFromHtmlInBrowser = async ({ recordTitle, editorHtml }) => {
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.left = '-99999px';
  tempContainer.style.top = '0';
  tempContainer.style.width = '794px';
  tempContainer.style.background = '#ffffff';
  tempContainer.style.padding = '24px';
  tempContainer.style.boxSizing = 'border-box';
  tempContainer.style.color = '#111111';
  tempContainer.style.fontFamily = 'Arial, Helvetica, sans-serif';
  tempContainer.innerHTML = String(editorHtml || '').trim() || '<p></p>';

  document.body.appendChild(tempContainer);

  try {
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 36;
    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;

    const pxPerPt = canvas.width / printableWidth;
    const pageHeightPx = Math.max(1, Math.floor(printableHeight * pxPerPt));
    const pageSliceCanvas = document.createElement('canvas');
    const sliceContext = pageSliceCanvas.getContext('2d');

    let offsetY = 0;
    let pageIndex = 0;

    while (offsetY < canvas.height) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - offsetY);

      pageSliceCanvas.width = canvas.width;
      pageSliceCanvas.height = sliceHeightPx;

      if (!sliceContext) {
        throw new Error('Could not create canvas context for PDF rendering.');
      }

      sliceContext.clearRect(0, 0, pageSliceCanvas.width, pageSliceCanvas.height);
      sliceContext.drawImage(
        canvas,
        0,
        offsetY,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx,
      );

      const sliceImgData = pageSliceCanvas.toDataURL('image/jpeg', 0.98);
      const renderHeightPt = sliceHeightPx / pxPerPt;

      if (pageIndex > 0) {
        pdf.addPage();
      }

      pdf.addImage(sliceImgData, 'JPEG', margin, margin, printableWidth, renderHeightPt, undefined, 'FAST');

      offsetY += sliceHeightPx;
      pageIndex += 1;
    }

    const fileName = `${sanitizePdfFileName(recordTitle)}.pdf`;
    const blob = pdf.output('blob');
    return new File([blob], fileName, { type: 'application/pdf' });
  } finally {
    tempContainer.remove();
  }
};

const TableModal = ({ isOpen, onClose, onSubmit }) => {
  const [rows, setRows] = useState('3');
  const [cols, setCols] = useState('3');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const rowNum = parseInt(rows);
    const colNum = parseInt(cols);
    
    if (rowNum > 0 && colNum > 0 && rowNum <= 20 && colNum <= 10) {
      onSubmit(rowNum, colNum);
      setRows('3');
      setCols('3');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-lg p-6 w-96 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Insert Table</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rows (1-20):</label>
            <input
              type="number"
              min="1"
              max="20"
              value={rows}
              onChange={(e) => setRows(e.target.value)}
              className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1B1B1B] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Columns (1-10):</label>
            <input
              type="number"
              min="1"
              max="10"
              value={cols}
              onChange={(e) => setCols(e.target.value)}
              className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1B1B1B] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#5EE6FE] hover:bg-[#40c6e3] text-white font-semibold rounded-lg disabled:opacity-50"
            disabled={!rows || !cols || parseInt(rows) <= 0 || parseInt(cols) <= 0}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
};

const SaveUploadModal = ({ isOpen, onClose, onSaveOnly, onUploadNow, title, recordType, petOwner, petPatient, labTypes }) => {
  if (!isOpen) return null;

  const getRecordTypeName = (typeId) => {
    const type = labTypes.find(t => t.id == typeId);
    return type ? type.name : 'Unknown';
  };

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-lg p-8 w-96 shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Save Document</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition"
            title="Close"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-semibold">Upload Note:</span> Uploading will send this record to the pet owner's account.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 dark:bg-[#2A2A2A] rounded-lg p-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Record Title</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Record Type</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{getRecordTypeName(recordType)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Pet Owner</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{petOwner || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Pet Patient</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{petPatient || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              onUploadNow();
              onClose();
            }}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-[#333] transition"
          >
            Upload Now
          </button>
          <button
            onClick={() => {
              onSaveOnly();
              onClose();
            }}
            className="flex-1 px-4 py-2.5 bg-[#5EE6FE] hover:bg-[#40c6e3] text-white font-semibold rounded-lg transition"
          >
            Save Only
          </button>
        </div>
      </div>
    </div>
  );
};

const UploadConfirmationModal = ({ isOpen, onClose, onConfirm, loading, documentContent, title, recordType, petOwner, petPatient, labTypes }) => {
  if (!isOpen) return null;

  const getRecordTypeName = (typeId) => {
    const type = labTypes.find(t => t.id == typeId);
    return type ? type.name : 'Unknown';
  };

  return (
    <div className="fixed inset-0 z-[102] flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col" style={{ width: '800px', maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Confirm Upload</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition disabled:opacity-50"
            title="Close"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4 mb-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <span className="font-semibold">Are you sure you want to upload this document?</span> This will send the record to the pet owner's account and you won't be able to edit it anymore.
              </p>
            </div>

            {/* Record Details */}
            <div className="bg-gray-50 dark:bg-[#2A2A2A] rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Record Title</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Record Type</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{getRecordTypeName(recordType)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Pet Owner</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{petOwner || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Pet Patient</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{petPatient || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Document Preview */}
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Document Preview</p>
              <div className="bg-white dark:bg-[#1B1B1B] border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-[420px] overflow-y-auto">
                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: documentContent }} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-[#333] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-[#5EE6FE] hover:bg-[#40c6e3] text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              <>
                Upload Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const DocumentEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const { petID, petName } = useParams();
  const decodeParam = (value) => {
    try {
      return decodeURIComponent(value || '');
    } catch {
      return value || '';
    }
  };
  const initialPetName = decodeParam(petName);
  const initialDraftId = location.state?.petMedicalID || null;
  const initialRecordStatus = String(location.state?.recordStatus || '').toLowerCase();
  
  const [title, setTitle] = useState(location.state?.recordTitle || 'Untitled Document');
  const [recordType, setRecordType] = useState(location.state?.labTypeID || '1');
  const [draftId, setDraftId] = useState(initialDraftId);
  const [labTypes, setLabTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(new Date());
  const [textColor, setTextColor] = useState('#000000');
  const [showTableModal, setShowTableModal] = useState(false);
  const [showSaveUploadModal, setShowSaveUploadModal] = useState(false);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [isUploaded, setIsUploaded] = useState(initialRecordStatus === 'uploaded');
  const [petOwner] = useState(
    location.state?.ownerName ||
    location.state?.owner ||
    location.state?.petOwner ||
    'N/A'
  );
  const [petPatient] = useState(initialPetName || 'N/A');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState({
    title: (location.state?.recordTitle || 'Untitled Document').trim(),
    recordType: String(location.state?.labTypeID || '1'),
    content: ''
  });

  const buildSnapshot = () => ({
    title: (title || '').trim(),
    recordType: String(recordType || ''),
    content: (editorRef.current?.innerHTML || '').trim()
  });

  const getDocumentEditorErrorMessage = (error, fallbackMessage) => {
    if (error?.response?.status === 413) {
      return 'Document content is too large to save. Please reduce embedded images or split content into smaller sections.';
    }

    return error?.response?.data?.message || error?.response?.data?.error || fallbackMessage;
  };

  const hasUnsavedChanges = () => {
    const current = buildSnapshot();
    return (
      current.title !== lastSavedSnapshot.title ||
      current.recordType !== lastSavedSnapshot.recordType ||
      current.content !== lastSavedSnapshot.content
    );
  };

  const hasMeaningfulHtml = (html) => {
    const normalized = String(html || '')
      .replace(/<br\s*\/?>/gi, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/<div>\s*<\/div>/gi, '')
      .replace(/<p>\s*<\/p>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .trim();

    return normalized.length > 0;
  };

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
    
    fetchLabTypes();

    if (editorRef.current) {
      setTimeout(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const initialHtml = (location.state?.editorHtml || '').trim();
        if (hasMeaningfulHtml(initialHtml)) {
          editor.innerHTML = initialHtml;
        } else if (!hasMeaningfulHtml(editor.innerHTML)) {
          insertRaphaVetsHeader();
        }

        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editor);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
        editor.focus();
        setLastSavedSnapshot({
          title: (title || '').trim(),
          recordType: String(recordType || ''),
          content: (editor.innerHTML || '').trim()
        });
      }, 50);
    }
  }, []);

  const handleSaveAndClose = () => {
    const content = editorRef.current?.innerHTML || '';
    const text = editorRef.current?.innerText || '';

    if (!title.trim()) {
      setErrorMessage('Document title is required');
      return;
    }

    if (!text.trim()) {
      setErrorMessage('Document cannot be empty');
      return;
    }

    setShowSaveUploadModal(true);
  };

  const saveDraft = async () => {
    const content = editorRef.current?.innerHTML || '';
    const payload = {
      petMedicalID: draftId,
      petID,
      recordTitle: title.trim(),
      labTypeID: Number(recordType),
      editorHtml: content
    };

    const response = await api.post('/admin/pet-records/draft/save', payload);

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to save draft');
    }

    const savedRecord = response.data.data || {};
    if (savedRecord.petMedicalID || savedRecord.id) {
      setDraftId(savedRecord.petMedicalID || savedRecord.id);
    }

    return savedRecord;
  };

  const handleSaveOnly = async () => {
    const text = editorRef.current?.innerText || '';

    if (!title.trim()) {
      setErrorMessage('Document title is required');
      return;
    }

    if (!text.trim()) {
      setErrorMessage('Document cannot be empty');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await saveDraft();
      
      setIsUploaded(false);
      setLastSaved(new Date());
      setLastSavedSnapshot(buildSnapshot());
      setSuccessMessage('Document saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      setErrorMessage(getDocumentEditorErrorMessage(error, 'Failed to save document.'));
    } finally {
      setLoading(false);
    }
  };

  const handleUploadNow = () => {
    setShowUploadConfirm(true);
  };

  const handleConfirmUpload = async () => {
    const text = editorRef.current?.innerText || '';

    if (!title.trim()) {
      setErrorMessage('Document title is required');
      return;
    }

    if (!text.trim()) {
      setErrorMessage('Document cannot be empty');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Always save current editor state before upload to avoid exporting stale draft content.
      const saved = await saveDraft();
      const resolvedDraftId =
        saved?.petMedicalID ||
        saved?.id ||
        draftId;

      if (!resolvedDraftId) {
        throw new Error('Missing draft ID while uploading');
      }

      const browserPdfFile = await createPdfFromHtmlInBrowser({
        recordTitle: title,
        editorHtml: editorRef.current?.innerHTML || '',
      });

      const formData = new FormData();
      formData.append('file', browserPdfFile);

      const response = await api.post(`/admin/pet-records/draft/${resolvedDraftId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to upload document');
      }
      
      setIsUploaded(true);
      setLastSaved(new Date());
      setLastSavedSnapshot(buildSnapshot());
      setSuccessMessage('✓ Document uploaded to pet owner successfully!');
      setShowUploadConfirm(false);
      setTimeout(() => navigate('/admin/pet-management'), 1500);
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage(getDocumentEditorErrorMessage(error, 'Failed to upload document.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    if (hasUnsavedChanges()) {
      setShowDiscardConfirm(true);
    } else {
      navigate(-1);
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    navigate(-1);
  };

  const applyFormatting = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertList = (type) => {
    const editor = editorRef.current;
    if (!editor) return;
    
    editor.focus();
    
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const selectedNode = range.startContainer;
    let currentBlock = getBlockElement(selectedNode);
    
    if (currentBlock && (currentBlock.tagName === 'LI' || currentBlock.parentElement?.tagName === 'LI')) {
      const listItem = currentBlock.tagName === 'LI' ? currentBlock : currentBlock.closest('li');
      if (listItem) {
        const currentList = listItem.parentElement;
        
        if ((type === 'ul' && currentList.tagName === 'UL') || 
            (type === 'ol' && currentList.tagName === 'OL')) {
          const p = document.createElement('p');
          p.innerHTML = listItem.innerHTML;
          
          listItem.replaceWith(p);
          
          if (currentList.children.length === 0) {
            currentList.remove();
          }
          
          const newRange = document.createRange();
          newRange.selectNodeContents(p);
          newRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(newRange);
          return;
        }
      }
    }
    
    let selectedText = selection.toString();
    let listHTML;
    
    if (selectedText) {
      const fragment = range.extractContents();
      const div = document.createElement('div');
      div.appendChild(fragment);
      
      const lines = div.innerText.split('\n');
      listHTML = type === 'ul' ? '<ul style="margin: 10px 0; padding-left: 40px; list-style-type: disc;">' : '<ol style="margin: 10px 0; padding-left: 40px; list-style-type: decimal;">';
      
      for (let line of lines) {
        if (line.trim()) {
          listHTML += `<li style="margin: 5px 0;">${line}</li>`;
        }
      }
      listHTML += type === 'ul' ? '</ul>' : '</ol>';
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = listHTML;
      range.deleteContents();
      range.insertNode(tempDiv.firstChild);
    } else {
      listHTML = type === 'ul' ? 
        '<ul style="margin: 10px 0; padding-left: 40px; list-style-type: disc;"><li style="margin: 5px 0;"><br></li></ul>' : 
        '<ol style="margin: 10px 0; padding-left: 40px; list-style-type: decimal;"><li style="margin: 5px 0;"><br></li></ol>';
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = listHTML;
      const listNode = tempDiv.firstChild;
      
      range.insertNode(listNode);
      
      const listItem = listNode.querySelector('li');
      if (listItem) {
        const newRange = document.createRange();
        newRange.setStart(listItem, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
    
    editor.focus();
  };
  
  const getBlockElement = (node) => {
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName;
        if (tagName === 'P' || tagName === 'DIV' || tagName === 'LI' || 
            tagName === 'H1' || tagName === 'H2' || tagName === 'H3' ||
            tagName === 'H4' || tagName === 'H5' || tagName === 'H6') {
          return node;
        }
      }
      node = node.parentNode;
    }
    return null;
  };
  
  const handleListKeyDown = (e) => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const currentNode = range.startContainer;
    const listItem = currentNode.nodeType === Node.TEXT_NODE ? 
      currentNode.parentElement?.closest('li') : 
      currentNode.closest?.('li');
    
    if (listItem) {
      if (e.key === 'Enter') {
        e.preventDefault();
        
        const listText = listItem.innerText.trim();
        
        if (listText === '') {
          const list = listItem.parentElement;
          
          const p = document.createElement('p');
          p.innerHTML = '<br>';
          
          listItem.replaceWith(p);
          
          if (list.children.length === 0) {
            list.remove();
          }
          
          const newRange = document.createRange();
          newRange.selectNodeContents(p);
          newRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } else {
          const newListItem = document.createElement('li');
          newListItem.innerHTML = '<br>';
          listItem.parentElement.insertBefore(newListItem, listItem.nextSibling);
          
          const newRange = document.createRange();
          newRange.setStart(newListItem, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
      else if (e.key === 'Backspace') {
        const isAtStart = range.collapsed && range.startOffset === 0;
        const isEmpty = listItem.innerText.trim() === '';
        
        if (isAtStart || isEmpty) {
          e.preventDefault();
          const list = listItem.parentElement;
          
          const currentText = listItem.innerHTML;
          
          const p = document.createElement('p');
          p.innerHTML = currentText || '<br>';
          
          listItem.replaceWith(p);
          
          if (list.children.length === 0) {
            list.remove();
          }
          
          const newRange = document.createRange();
          newRange.selectNodeContents(p);
          newRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }
  };
  
  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('keydown', handleListKeyDown);
      return () => {
        editor.removeEventListener('keydown', handleListKeyDown);
      };
    }
  }, []);

  const setAlignment = (align) => {
    document.execCommand(`justify${align}`);
    editorRef.current?.focus();
  };

  const setFontSize = (size) => {
    document.execCommand('fontSize', false, size);
    editorRef.current?.focus();
  };

  const setFontFamily = (family) => {
    document.execCommand('fontName', false, family);
    editorRef.current?.focus();
  };

  const applyTextColor = () => {
    document.execCommand('foreColor', false, textColor);
    editorRef.current?.focus();
  };

  const insertImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.margin = '10px 0';
        img.style.resize = 'both';
        img.style.overflow = 'auto';
        img.style.cursor = 'nwse-resize';
        img.style.userSelect = 'none';
        img.contentEditable = 'false';

        const range = window.getSelection().getRangeAt(0);
        range.insertNode(img);
        editorRef.current?.focus();
      };
      reader.readAsDataURL(file);
    }
  };

  const insertTable = (rows, cols) => {
    const editor = editorRef.current;
    if (!editor) return;
    
    let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 10px 0; border: 1px solid #ccc;"><tbody>';
    for (let i = 0; i < rows; i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < cols; j++) {
        tableHTML += '<td style="border: 1px solid #ccc; padding: 12px; min-width: 100px; text-align: left; font-size: 12pt; background: white;"><br></td>';
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table><p><br></p>';
    
    // Create and position the range at the end of editor content FIRST
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false); // Collapse to end
    
    // Set up selection with the range BEFORE inserting
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Now insert the table HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = tableHTML;
    
    let lastNode = null;
    while (tempDiv.firstChild) {
      const node = tempDiv.firstChild;
      range.insertNode(node);
      lastNode = node;
      range.setStartAfter(node);
      range.collapse(true);
    }
    
    // Position cursor after the table
    if (lastNode) {
      range.setStartAfter(lastNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    editor.focus();
  };

  const insertRaphaVetsHeader = () => {
    const configuredLogoUrl = (process.env.REACT_APP_CLINIC_LOGO_URL || "").trim();
    const logoUrl = configuredLogoUrl || `${window.location.origin}/images/logo.png`;
    const header = `<div contenteditable="false" style="display: flex; align-items: flex-start; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #999; margin-top: 0; user-select: none;"><img src="${logoUrl}" alt="RaphaVets Logo" style="width: 50px; height: 50px; flex-shrink: 0; object-fit: contain; margin-right: 12px; margin-top: 0;" /><div style="flex-grow: 1;"><h2 style="margin: 0 0 0 0; font-size: 12pt; font-weight: bold; color: #000; line-height: 1.2;">RaphaVets Pet Clinic</h2><p style="margin: 2px 0 0 0; font-size: 11pt; color: #333; line-height: 1.2;">Block 3, Lot 22 Camia, Pembo, Taguig</p></div></div><p><br></p>`;
    if (!editorRef.current) return;
    editorRef.current.innerHTML = header;
    editorRef.current.focus();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-[#1A1A1A]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={handleDiscard}
            className="p-2 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition"
            title="Go back"
          >
            <ChevronLeft size={20} className="text-gray-700 dark:text-gray-300" />
          </button>

          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploaded}
              placeholder="Document Title"
              className="w-full text-2xl font-semibold bg-transparent border-0 text-gray-900 dark:text-gray-100 focus:outline-none placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {initialPetName} • Last modified: {lastSaved.toLocaleTimeString()}
              {isUploaded && <span className="ml-2 inline-block px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-semibold">Uploaded</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSaving && (
            <div className="flex items-center gap-1 text-xs text-blue-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Saving...</span>
            </div>
          )}

          <button
            onClick={handleSaveAndClose}
            disabled={loading || isUploaded}
            className="flex items-center gap-2 px-4 py-2 bg-[#5EE6FE] hover:bg-[#40c6e3] text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={isUploaded ? "This document has been uploaded and cannot be edited" : ""}
          >
            <Save size={18} />
            {isUploaded ? 'Uploaded' : 'Save'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {!isUploaded ? (
      <div className="bg-white dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center gap-1 flex-wrap flex-shrink-0 overflow-x-auto">
        {/* Record Type */}
        <select
          value={recordType}
          onChange={(e) => setRecordType(e.target.value)}
          disabled={isUploaded}
          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1B1B1B] text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50 hover:border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {labTypes.map(type => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

        {/* Undo/Redo */}
        <button
          onClick={() => applyFormatting('undo')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-700 dark:text-gray-300"
          title="Undo (Ctrl+Z)"
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={() => applyFormatting('redo')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-700 dark:text-gray-300"
          title="Redo (Ctrl+Y)"
        >
          <RotateCw size={18} />
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

        {/* Font Family */}
        <select
          onChange={(e) => setFontFamily(e.target.value)}
          defaultValue="Arial"
          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1B1B1B] text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50 hover:border-gray-300"
        >
          <option value="Arial">Arial</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Verdana">Verdana</option>
        </select>

        {/* Font Size */}
        <select
          onChange={(e) => setFontSize(e.target.value)}
          defaultValue="3"
          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1B1B1B] text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50 hover:border-gray-300"
        >
          <option value="1">8pt</option>
          <option value="2">10pt</option>
          <option value="3">12pt</option>
          <option value="4">14pt</option>
          <option value="5">18pt</option>
          <option value="6">24pt</option>
          <option value="7">36pt</option>
        </select>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

        {/* Text Formatting */}
        <button
          onClick={() => applyFormatting('bold')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-700 dark:text-gray-300"
          title="Bold (Ctrl+B)"
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => applyFormatting('italic')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-700 dark:text-gray-300"
          title="Italic (Ctrl+I)"
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() => applyFormatting('underline')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-700 dark:text-gray-300"
          title="Underline (Ctrl+U)"
        >
          <Underline size={18} />
        </button>

        {/* Text Color */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-gray-300"
            title="Text Color"
          />
          <button
            onClick={applyTextColor}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-700 dark:text-gray-300"
            title="Apply Text Color"
          >
            <Palette size={18} />
          </button>
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

        {/* Alignment */}
        <button
          onClick={() => setAlignment('Left')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-700 dark:text-gray-300"
          title="Align Left"
        >
          <AlignLeft size={18} />
        </button>
        <button
          onClick={() => setAlignment('Center')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-700 dark:text-gray-300"
          title="Align Center"
        >
          <AlignCenter size={18} />
        </button>
        <button
          onClick={() => setAlignment('Right')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-700 dark:text-gray-300"
          title="Align Right"
        >
          <AlignRight size={18} />
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

        {/* Lists */}
        <button
          onClick={() => insertList('ul')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-700 dark:text-gray-300"
          title="Bullet List"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => insertList('ol')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-700 dark:text-gray-300"
          title="Numbered List"
        >
          <ListOrdered size={18} />
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

        {/* Table */}
        <button
          onClick={() => setShowTableModal(true)}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-700 dark:text-gray-300"
          title="Insert Table"
        >
          <Table2 size={18} />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>
      ) : (
        <div className="bg-white dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-gray-700 px-6 py-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">This document has been uploaded and is now read-only.</p>
        </div>
      )}

      {/* Messages */}
      {successMessage && (
        <div className="mx-6 mt-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 rounded-lg text-green-700 dark:text-green-400 text-sm font-medium flex-shrink-0 flex items-start gap-3">
          <span className="text-lg">✓</span>
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="mx-6 mt-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 rounded-lg text-red-700 dark:text-red-400 text-sm font-medium flex-shrink-0 flex items-start gap-3">
          <span className="text-lg">✕</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Editor Container */}
      <div className="flex-1 overflow-auto flex items-start justify-center px-4 bg-gray-100 dark:bg-[#1A1A1A]" style={{ paddingTop: '20px' }}>
        <style>
          {`
            /* List styling for the editor */
            [contenteditable="true"] ul,
            [contenteditable="true"] ol {
              margin: 10px 0;
              padding-left: 40px !important;
            }
            
            [contenteditable="true"] ul {
              list-style-type: disc !important;
            }
            
            [contenteditable="true"] ul ul {
              list-style-type: circle !important;
            }
            
            [contenteditable="true"] ul ul ul {
              list-style-type: square !important;
            }
            
            [contenteditable="true"] ol {
              list-style-type: decimal !important;
            }
            
            [contenteditable="true"] ol ol {
              list-style-type: lower-alpha !important;
            }
            
            [contenteditable="true"] ol ol ol {
              list-style-type: lower-roman !important;
            }
            
            [contenteditable="true"] li {
              display: list-item !important;
              margin: 4px 0;
              list-style-position: outside !important;
            }
            
            [contenteditable="true"] li::marker {
              color: inherit;
            }
          `}
        </style>
        <div
          ref={editorRef}
          contentEditable={!isUploaded}
          suppressContentEditableWarning={true}
          className={`w-full bg-white dark:bg-[#1C1C1E] shadow-lg p-8 focus:outline-none text-base leading-relaxed ${
            isUploaded ? 'opacity-90 cursor-not-allowed' : 'text-gray-800 dark:text-gray-100'
          } text-gray-800 dark:text-gray-100`}
          style={{
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            width: '8.5in',
            minHeight: '11in',
            pageBreakAfter: 'always',
            paddingTop: '20px',
            pointerEvents: isUploaded ? 'none' : 'auto'
          }}
        />
      </div>

      {/* Table Modal */}
      <TableModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onSubmit={(rows, cols) => {
          insertTable(rows, cols);
          setShowTableModal(false);
        }}
      />

      {/* Save/Upload Modal */}
      <SaveUploadModal
        isOpen={showSaveUploadModal}
        onClose={() => setShowSaveUploadModal(false)}
        onSaveOnly={handleSaveOnly}
        onUploadNow={handleUploadNow}
        title={title}
        recordType={recordType}
        petOwner={petOwner}
        petPatient={petPatient}
        labTypes={labTypes}
      />

      {/* Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[102] flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-lg p-8 w-96 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Discard Changes?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              You have unsaved changes. Are you sure you want to discard them?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-[#333] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDiscard}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Confirmation Modal */}
      <UploadConfirmationModal
        isOpen={showUploadConfirm}
        onClose={() => setShowUploadConfirm(false)}
        onConfirm={handleConfirmUpload}
        loading={loading}
        documentContent={editorRef.current?.innerHTML || ''}
        title={title}
        recordType={recordType}
        petOwner={petOwner}
        petPatient={petPatient}
        labTypes={labTypes}
      />
    </div>
  );
};

export default DocumentEditor;