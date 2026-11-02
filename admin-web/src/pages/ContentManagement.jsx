import { useState, useEffect } from "react";
import Header from "../components/template/Header";
import { Video, FileText, Archive, ChevronDown, ChevronUp } from "lucide-react";
import api from "../api/axios";
import { useAlert } from "../hooks/useAlert.jsx";

// Import components from organized structure
import {
  PetTipsSection,
  PetTipModal,
  VideosSection,
  VideoModal,
} from "../components/content-management";

const ContentManagement = () => {
  const { showSuccess, showError, showConfirm, showToast, AlertComponent } = useAlert();
  const [activeTab, setActiveTab] = useState("articles");
  const [showPetTipModal, setShowPetTipModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(true);

  // State for data from backend
  const [petTips, setPetTips] = useState([]);
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [icons, setIcons] = useState([]);
  const [publicationStatuses, setPublicationStatuses] = useState([]);
  const [videoCategories, setVideoCategories] = useState([]);

  // Get current admin info from localStorage or auth context
  const currentAdminId = localStorage.getItem('userId') || 'unknown';
  const currentAdminName = localStorage.getItem('userName') || 'Admin';


  // Stats state
  const [stats, setStats] = useState({
    publishedTips: 0,
    publishedVideos: 0,
    archives: 0
  });

  // Handle new video category creation
  const handleNewVideoCategoryCreated = async (newCategory) => {
    await fetchVideoCategories();
    showToast('Video category created successfully!', 'success');
  };

  // Handle new category creation
  const handleNewCategoryCreated = (newCategory) => {
    setCategories(prev => [...prev, newCategory]);
    showToast('Category created successfully!', 'success');
  };

  // Fetch videos
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/content/videos/videos/");
      setVideos(response.data.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
      showError('Failed to fetch videos. Please try again.', {
        title: 'Data Notice'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch video categories
  const fetchVideoCategories = async () => {
    try {
      const response = await api.get("/admin/content/videos/categories");
      setVideoCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching video categories:', error);
    }
  };

  // Fetch pet care tips
  const fetchPetCareTips = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/content/pet-care-tips");
      setPetTips(response.data.data);
    } catch (error) {
      console.error('Error fetching pet care tips:', error);
      showError('Failed to fetch pet care tips', {
        title: 'Data Notice'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await api.get("/admin/content/pet-care-categories");
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch icons
  const fetchIcons = async () => {
    try {
      const response = await api.get("/admin/content/pet-care-tips/icons");
      setIcons(response.data.data);
    } catch (error) {
      console.error('Error fetching icons:', error);
    }
  };

  // Fetch publication statuses
  const fetchPublicationStatuses = async () => {
    try {
      const response = await api.get("/admin/content/publication-statuses");
      setPublicationStatuses(response.data.data);
    } catch (error) {
      console.error('Error fetching publication statuses:', error);
    }
  };

  // Fetch all data on component mount
  useEffect(() => {
    fetchPetCareTips();
    fetchVideos(); 
    fetchCategories();
    fetchVideoCategories(); 
    fetchIcons();
    fetchPublicationStatuses();
  }, []);

  // Update stats when data changes
  useEffect(() => {
    updateStats();
  }, [petTips, videos]);

  // Update stats
  const updateStats = () => {
    const publishedTips = petTips.filter(tip => tip.status === "Published").length;
    const publishedVideos = videos.filter(video => video.status === "Published").length;
    const archives = petTips.filter(tip => tip.status === "Archived").length + 
                    videos.filter(video => video.status === "Archived").length;
    
    setStats({ publishedTips, publishedVideos, archives });
  };

  const getApiErrorMessage = (error, fallbackMessage) => {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      fallbackMessage
    );
  };

  // Handle add/edit pet tip
  const handleAddPetTip = async (data) => {
    try {
      setLoading(true);

      const requestData = {
        title: data.title,
        shortDescription: data.shortDescription,
        detailedContent: data.detailedContent,
        learnMoreURL: data.learnMoreURL || '',
        iconID: data.iconID,
        petCareCategoryID: data.petCareCategoryID,
        pubStatusID: data.pubStatusID || 1
      };

      let response;
      
      if (editingItem) {
        response = await api.put(`/admin/content/pet-care-tips/updatePetCare/${editingItem.id}`, requestData);
      } else {
        response = await api.post("/admin/content/pet-care-tips/createPetCare", requestData);
      }

      if (response.data.success) {
        await fetchPetCareTips();
        setShowPetTipModal(false);
        setEditingItem(null);
        showSuccess(response.data.message || 'Article saved successfully!', {
          title: 'Success'
        });
      } else {
        showError(response.data.message || 'Failed to save article', {
          title: 'Save Failed'
        });
      }
    } catch (error) {
      console.error('Error saving article:', error);
      showError(getApiErrorMessage(error, 'Failed to save article'), {
        title: 'Action Needed'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete pet tip
  const handleDeletePetTip = (id) => {
    (async () => {
      try {
        setLoading(true);
        const response = await api.delete(`/admin/content/pet-care-tips/deletePetCare/${id}`);

        if (response.data.success) {
          await fetchPetCareTips();
          showSuccess('Article deleted successfully!', {
            title: 'Deleted'
          });
        } else {
          showError(response.data.message || 'Failed to delete article', {
            title: 'Delete Failed'
          });
        }
      } catch (error) {
        console.error('Error deleting article:', error);
        showError(error.response?.data?.message || 'Failed to delete article', {
          title: 'Action Needed'
        });
      } finally {
        setLoading(false);
      }
    })();
  };

  // Handle edit pet tip
  const handleEditPetTip = (item) => {
    setEditingItem(item);
    setShowPetTipModal(true);
  };

  // Handle add/edit video
  const handleAddVideo = async (data) => {
    try {
      setLoading(true);
      
      const requestData = {
        videoTitle: data.videoTitle,
        videoURL: data.videoURL,
        videoCategoryID: data.videoCategoryID,
        pubStatusID: data.pubStatusID || 1
      };

      let response;
      
      if (editingItem) {
        response = await api.put(`/admin/content/videos/update/${editingItem.id}`, requestData);
      } else {
        response = await api.post("/admin/content/videos/create", requestData);
      }

      if (response.data.success) {
        await fetchVideos();
        setShowVideoModal(false);
        setEditingItem(null);
        showSuccess(response.data.message || 'Video saved successfully!', {
          title: 'Success'
        });
      } else {
        showError(response.data.message || 'Failed to save video', {
          title: 'Save Failed'
        });
      }
    } catch (error) {
      console.error('Error saving video:', error);
      showError(getApiErrorMessage(error, 'Failed to save video'), {
        title: 'Action Needed'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete video
  const handleDeleteVideo = (id) => {
    (async () => {
      try {
        setLoading(true);
        const response = await api.delete(`/admin/content/videos/delete/${id}`);

        if (response.data.success) {
          await fetchVideos();
          showSuccess('Video deleted successfully!', {
            title: 'Deleted'
          });
        } else {
          showError(response.data.message || 'Failed to delete video', {
            title: 'Delete Failed'
          });
        }
      } catch (error) {
        console.error('Error deleting video:', error);
        showError(error.response?.data?.message || 'Failed to delete video', {
          title: 'Action Needed'
        });
      } finally {
        setLoading(false);
      }
    })();
  };

  // Handle edit video
  const handleEditVideo = (item) => {
    setEditingItem(item);
    setShowVideoModal(true);
  };

  return (
    <div className="flex flex-col h-screen bg-[#FBFBFB] p-6 gap-1 font-sans">
      <Header title=" Content Management" />
      
      {/* Add Alert Component */}
      <AlertComponent />

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-700">Loading...</span>
          </div>
        </div>
      )}

      {/* Stats Section Header with Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Overview</h2>
        <button
          onClick={() => setShowStats(!showStats)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-300"
        >
          {showStats ? (
            <>
              <ChevronUp size={16} />
              Hide Stats
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Show Stats
            </>
          )}
        </button>
      </div>

      {/* Stats Cards with Smooth Collapse/Expand */}
      <div className={`
        transition-all duration-500 ease-in-out overflow-hidden
        ${showStats ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 mb-0'}
      `}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 transform transition-transform duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-semibold">Published Articles</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.publishedTips}</p>
              </div>
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 transform transition-transform duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-semibold">Published Videos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.publishedVideos}</p>
              </div>
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Video className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 transform transition-transform duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-semibold">Archives</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.archives}</p>
              </div>
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Archive className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-2 relative">
        {[
          { id: "articles", name: "Articles", icon: FileText },
          { id: "videos", name: "Videos", icon: Video }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-5 py-2 font-semibold text-sm transition-colors ${
              activeTab === tab.id
                ? "text-[#5EE6FE]"
                : "text-gray-600 hover:text-[#5EE6FE]"
            }`}
          >
            <div className="flex items-center gap-2">
              <tab.icon size={18} />
              <span>{tab.name}</span>
            </div>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-[#5EE6FE] rounded-t-lg" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {/* Articles Tab */}
        {activeTab === "articles" && (
          <PetTipsSection
            petTips={petTips}
            onAdd={() => setShowPetTipModal(true)}
            onEdit={handleEditPetTip}
            onDelete={handleDeletePetTip}
            onRefresh={fetchPetCareTips}
            loading={loading}
            allCategories={categories}
            allStatuses={publicationStatuses}
            currentAdminId={currentAdminId}
            currentAdminName={currentAdminName}
            showConfirm={showConfirm}
            showSuccess={showSuccess}
            showError={showError}
          />
        )}

        {/* Videos Tab */}
        {activeTab === "videos" && (
          <VideosSection
            videos={videos}
            onAdd={() => setShowVideoModal(true)}
            onEdit={handleEditVideo}
            onDelete={handleDeleteVideo}
            onRefresh={fetchVideos}
            loading={loading}
            allCategories={videoCategories}
            allStatuses={publicationStatuses}
            currentAdminId={currentAdminId}
            currentAdminName={currentAdminName}
            showConfirm={showConfirm}
            showSuccess={showSuccess}
            showError={showError}
          />
        )}

      </div>

      {/* Modals */}
      {showPetTipModal && (
        <PetTipModal
          item={editingItem}
          categories={categories}
          icons={icons}
          publicationStatuses={publicationStatuses}
          onClose={() => {
            setShowPetTipModal(false);
            setEditingItem(null);
          }}
          onSave={handleAddPetTip}
          loading={loading}
          onNewCategoryCreated={handleNewCategoryCreated}
          showSuccess={showSuccess}
          showError={showError}
        />
      )}

      {showVideoModal && (
        <VideoModal
          item={editingItem}
          categories={videoCategories}
          publicationStatuses={publicationStatuses}
          onClose={() => {
            setShowVideoModal(false);
            setEditingItem(null);
          }}
          onSave={handleAddVideo}
          loading={loading}
          onNewCategoryCreated={handleNewVideoCategoryCreated}
          showSuccess={showSuccess}
          showError={showError}
        />
      )}
    </div>
  );
};

export default ContentManagement;
