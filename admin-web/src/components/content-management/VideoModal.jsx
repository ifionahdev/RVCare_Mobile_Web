import { useState, useEffect, useRef } from "react";
import { X, Plus, Minus, Video, Globe, Eye, FileText, Archive } from "lucide-react";
import api from "../../api/axios";

const isValidHttpUrl = (value = "") => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const isValidYoutubeUrl = (value = "") => {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/i.test(String(value).trim());
};

const MAX_VIDEO_TITLE_LENGTH = 120;
const MAX_VIDEO_URL_LENGTH = 500;
const MAX_VIDEO_CATEGORY_LENGTH = 80;

const VideoModal = ({ 
  item, 
  categories, 
  publicationStatuses, 
  onClose, 
  onSave, 
  loading, 
  onNewCategoryCreated,
  showSuccess,
  showError 
}) => {
  const [formData, setFormData] = useState({
    videoTitle: "",
    videoURL: "",
    videoCategoryID: "",
    pubStatusID: 1,
    newCategory: ""
  });

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [youtubeMetadata, setYoutubeMetadata] = useState(null);
  const [titleLookupState, setTitleLookupState] = useState("idle");
  const [titleLookupError, setTitleLookupError] = useState("");
  const lastFetchedTitle = useRef("");

  // Helper function to get status ID from item
  const getStatusIdFromItem = (item) => {
    if (!item) return 1;
    
    if (item.pubStatusID) {
      return item.pubStatusID;
    }
    
    if (item.status) {
      const statusMap = {
        "Draft": 1,
        "Published": 2, 
        "Archived": 3
      };
      return statusMap[item.status] || 1;
    }
    
    return 1;
  };

  // Helper function to get category ID from item
  const getCategoryIdFromItem = (item, categories) => {
    if (!item) return categories?.[0]?.id?.toString() || "";
    
    if (item.videoCategoryID) {
      return item.videoCategoryID.toString();
    }
    
    if (item.category && categories) {
      const matchingCategory = categories.find(cat => 
        cat.name === item.category || 
        cat.videoCategory === item.category
      );
      if (matchingCategory) {
        return matchingCategory.id.toString();
      }
    }
    
    if (categories && categories.length > 0) {
      return categories[0].id.toString();
    }
    
    return "";
  };

  // Initialize form data
  useEffect(() => {
    lastFetchedTitle.current = "";
    setYoutubeMetadata(null);
    setTitleLookupState("idle");
    setTitleLookupError("");

    if (item) {
      const initialPubStatusID = getStatusIdFromItem(item);
      const initialCategoryID = getCategoryIdFromItem(item, categories);

      setFormData({
        videoTitle: item.title || item.videoTitle || "",
        videoURL: item.videoURL || "",
        videoCategoryID: initialCategoryID,
        pubStatusID: initialPubStatusID,
        newCategory: ""
      });
      
      setShowNewCategory(false);
      
    } else {
      const defaultCategoryID = categories?.[0]?.id ? categories[0].id.toString() : "";
      
      setFormData({
        videoTitle: "",
        videoURL: "",
        videoCategoryID: defaultCategoryID,
        pubStatusID: 1,
        newCategory: ""
      });
      setShowNewCategory(false);
    }
  }, [item, categories, publicationStatuses]);

  useEffect(() => {
    const videoURL = formData.videoURL.trim();
    if (!isValidHttpUrl(videoURL) || !isValidYoutubeUrl(videoURL)) {
      setYoutubeMetadata(null);
      setTitleLookupState("idle");
      setTitleLookupError("");
      return undefined;
    }

    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(async () => {
      setTitleLookupState("loading");
      setTitleLookupError("");
      setYoutubeMetadata(null);
      try {
        const response = await api.post(
          "/admin/content/videos/metadata",
          { videoURL },
          { signal: controller.signal },
        );
        const metadata = response.data?.data;
        if (!response.data?.success || typeof metadata?.title !== "string") {
          throw new Error(response.data?.message || "YouTube title was not returned.");
        }

        const fetchedTitle = metadata.title.trim().slice(0, MAX_VIDEO_TITLE_LENGTH);
        if (!active) return;
        setYoutubeMetadata(metadata);
        setFormData((current) => ({
          ...current,
          videoTitle:
            !current.videoTitle.trim() ||
            current.videoTitle === lastFetchedTitle.current
              ? fetchedTitle
              : current.videoTitle,
        }));
        lastFetchedTitle.current = fetchedTitle;
        setTitleLookupState("success");
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        setYoutubeMetadata(null);
        setTitleLookupState("error");
        setTitleLookupError(
          error.response?.data?.message ||
            "Could not fetch the YouTube title. You can enter it manually.",
        );
      }
    }, 500);

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [formData.videoURL]);

  // Function to create a new video category
  const createNewVideoCategory = async (categoryName) => {
    try {
      setCategoryLoading(true);
      
      const response = await api.post('/admin/content/videos/createCategory', {
        videoCategory: categoryName.trim()
      });


      if (response.data.success) {
        if (onNewCategoryCreated) {
          onNewCategoryCreated(response.data.data);
        }
        showSuccess('Video category created successfully!');
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create video category');
      }
    } catch (error) {
      console.error('Error creating video category:', error);
      showError(error.response?.data?.message || 'Failed to create video category');
      throw error;
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    

    // Validate required fields
    if (!formData.videoTitle.trim()) {
      showError('Please enter a video title');
      return;
    }

    if (formData.videoTitle.trim().length > MAX_VIDEO_TITLE_LENGTH) {
      showError(`Video title must be ${MAX_VIDEO_TITLE_LENGTH} characters or fewer.`);
      return;
    }

    if (!formData.videoURL.trim()) {
      showError('Please enter a YouTube URL');
      return;
    }

    if (formData.videoURL.trim().length > MAX_VIDEO_URL_LENGTH) {
      showError(`Video URL must be ${MAX_VIDEO_URL_LENGTH} characters or fewer.`);
      return;
    }

    const videoUrlValue = formData.videoURL.trim();
    if (!isValidHttpUrl(videoUrlValue)) {
      showError('Please provide a valid URL starting with http:// or https://');
      return;
    }

    if (!isValidYoutubeUrl(videoUrlValue)) {
      showError('Please provide a valid YouTube URL (youtube.com or youtu.be).');
      return;
    }

    // Category validation
    if (showNewCategory) {
      if (!formData.newCategory.trim()) {
        showError('Please enter a new category name');
        return;
      }

      if (formData.newCategory.trim().length > MAX_VIDEO_CATEGORY_LENGTH) {
        showError(`Category name must be ${MAX_VIDEO_CATEGORY_LENGTH} characters or fewer.`);
        return;
      }
    } else {
      if (!formData.videoCategoryID) {
        showError('Please select a category');
        return;
      }
    }

    try {
      let finalCategoryID;

      // If creating a new category, create it first
      if (showNewCategory && formData.newCategory.trim()) {
        const newCategory = await createNewVideoCategory(formData.newCategory);
        
        if (!newCategory || !newCategory.id) {
          throw new Error('Video category was created but no ID was returned');
        }
        
        finalCategoryID = newCategory.id;
      } else {
        finalCategoryID = formData.videoCategoryID;
      }

      // Validate finalCategoryID
      if (!finalCategoryID || isNaN(parseInt(finalCategoryID))) {
        showError('Invalid category ID. Please try again.');
        return;
      }

      // Prepare data for backend
      const submitData = {
        videoTitle: formData.videoTitle.trim(),
        videoURL: videoUrlValue,
        videoCategoryID: parseInt(finalCategoryID),
        pubStatusID: parseInt(formData.pubStatusID)
      };

      onSave(submitData);

    } catch (error) {
      console.error('Error in video form submission:', error);
      showError(error.response?.data?.message || error.message || 'Failed to save video.');
    }
  };

  const handleStatusChange = (pubStatusID) => {
    setFormData({ ...formData, pubStatusID: parseInt(pubStatusID) });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCategoryMode = () => {
    setShowNewCategory(!showNewCategory);
    // Reset the other field when switching modes
    if (showNewCategory) {
      setFormData(prev => ({ ...prev, newCategory: "" }));
    } else {
      setFormData(prev => ({ ...prev, videoCategoryID: "" }));
    }
  };

  // Helper function to get status name from ID
  const getStatusName = (statusId) => {
    const statusMap = {
      1: 'Draft',
      2: 'Published',
      3: 'Archived'
    };
    return statusMap[statusId] || 'Draft';
  };

  // Get current status name for display
  const currentStatus = getStatusName(formData.pubStatusID);

  // Category rendering with toggle
  const renderCategorySelect = () => {
    return (
      <div className="flex space-x-2">
        {showNewCategory ? (
          <input
            type="text"
            value={formData.newCategory}
            onChange={(e) => handleInputChange('newCategory', e.target.value)}
            maxLength={MAX_VIDEO_CATEGORY_LENGTH}
            disabled={loading || categoryLoading}
            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            placeholder="Enter new category name"
          />
        ) : (
          <select
            value={formData.videoCategoryID}
            onChange={(e) => handleInputChange('videoCategoryID', e.target.value)}
            disabled={loading || !categories || categories.length === 0}
            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            required={!showNewCategory}
          >
            <option value="">Select category</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name || cat.videoCategory}
              </option>
            ))}
          </select>
        )}
        
        <button
          type="button"
          onClick={toggleCategoryMode}
          disabled={loading || categoryLoading}
          className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center"
        >
          {showNewCategory ? (
            <Minus size={16} className="text-red-500" />
          ) : (
            <Plus size={16} className="text-green-500" />
          )}
        </button>
      </div>
    );
  };

  // Safe status rendering
  const renderStatusButtons = () => {
    if (!publicationStatuses || publicationStatuses.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No status options available
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-3">
        {publicationStatuses.map((status) => {
          const isSelected = formData.pubStatusID === status.id;
          
          return (
            <button
              key={status.id}
              type="button"
              onClick={() => handleStatusChange(status.id)}
              disabled={loading}
              className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                isSelected
                  ? status.id === 1 ? "border-blue-500 bg-blue-50" :
                    status.id === 2 ? "border-green-500 bg-green-50" :
                    "border-gray-500 bg-gray-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {status.id === 1 && <FileText className={`h-5 w-5 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />}
              {status.id === 2 && <Eye className={`h-5 w-5 ${isSelected ? "text-green-600" : "text-gray-400"}`} />}
              {status.id === 3 && <Archive className={`h-5 w-5 ${isSelected ? "text-gray-600" : "text-gray-400"}`} />}
              <span className={`text-sm font-medium ${
                isSelected 
                  ? status.id === 1 ? "text-blue-600" :
                    status.id === 2 ? "text-green-600" :
                    "text-gray-600"
                  : "text-gray-600"
              }`}>
                {status.name}
              </span>
              <span className="text-xs text-gray-500 text-center">{status.description}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-semibold text-gray-800">
            {item ? "Edit Video" : "Create New Video"}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors duration-200"
            disabled={loading}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex min-h-0">
          {/* Left Side - Basic Information */}
          <div className="flex-1 border-r border-gray-200 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Video Title *</label>
                <input
                  type="text"
                  value={formData.videoTitle}
                  onChange={(e) => handleInputChange('videoTitle', e.target.value)}
                  maxLength={MAX_VIDEO_TITLE_LENGTH}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter video title"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 text-right">{formData.videoTitle.length}/{MAX_VIDEO_TITLE_LENGTH}</p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Category *</label>
                {renderCategorySelect()}
                {!formData.videoCategoryID && !showNewCategory && (
                  <p className="text-red-500 text-xs">Please select a category</p>
                )}
                {showNewCategory && !formData.newCategory && (
                  <p className="text-red-500 text-xs">Please enter a category name</p>
                )}
                <p className="text-xs text-gray-500">
                  {showNewCategory 
                    ? "Enter a new category name" 
                    : "Select an existing category or click + to add new"}
                </p>
              </div>

              {/* YouTube URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">YouTube URL *</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="url"
                    value={formData.videoURL}
                    onChange={(e) => handleInputChange('videoURL', e.target.value)}
                    maxLength={MAX_VIDEO_URL_LENGTH}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://youtube.com/watch?v=..."
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500">Must be a valid http:// or https:// link</p>
                <p className="text-xs text-gray-500 text-right">{formData.videoURL.length}/{MAX_VIDEO_URL_LENGTH}</p>
                <p
                  aria-live="polite"
                  className={`text-xs ${
                    titleLookupState === "error" ? "text-amber-700" : "text-gray-500"
                  }`}
                >
                  {titleLookupState === "loading" && "Fetching the YouTube title..."}
                  {titleLookupState === "success" && "Title fetched from YouTube; you can edit it."}
                  {titleLookupState === "error" && titleLookupError}
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Content & Status */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Status Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Publication Status</label>
                {renderStatusButtons()}

                {/* Status Indicator */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    currentStatus === "Published" ? "bg-green-500" :
                    currentStatus === "Draft" ? "bg-blue-500" : "bg-gray-500"
                  }`} />
                  <span className="text-sm text-gray-600">
                    Status: <span className="font-medium capitalize">{currentStatus}</span>
                  </span>
                </div>
              </div>

              {/* Preview Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Preview</label>
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  {youtubeMetadata?.thumbnailUrl && (
                    <img
                      src={youtubeMetadata.thumbnailUrl}
                      alt="YouTube video preview"
                      className="mb-3 aspect-video w-full rounded-lg object-cover"
                    />
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white rounded-lg border border-red-100">
                      <Video className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{formData.videoTitle || "Video title will appear here"}</h4>
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        {categories?.find(cat => cat.id === parseInt(formData.videoCategoryID))?.name || 
                         formData.newCategory || "Category"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className={`w-2 h-2 rounded-full ${
                currentStatus === "Published" ? "bg-green-500" :
                currentStatus === "Draft" ? "bg-blue-500" : "bg-gray-500"
              }`} />
              {currentStatus === "Draft" && "This video will be saved as draft"}
              {currentStatus === "Published" && "This video will be published immediately"}
              {currentStatus === "Archived" && "This video will be archived"}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading || categoryLoading}
                className={`px-6 py-2.5 rounded-lg text-white font-medium transition-colors duration-200 flex items-center gap-2 ${
                  loading || categoryLoading ? "bg-gray-400 cursor-not-allowed" :
                  currentStatus === "Published" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : currentStatus === "Archived"
                    ? "bg-gray-600 hover:bg-gray-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {(loading || categoryLoading) && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {currentStatus === "Draft" && ((loading || categoryLoading) ? "Saving..." : "Save as Draft")}
                {currentStatus === "Published" && ((loading || categoryLoading) ? "Publishing..." : "Publish Now")}
                {currentStatus === "Archived" && ((loading || categoryLoading) ? "Archiving..." : "Archive")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
