import { useState, useEffect } from "react";
import Header from "../components/template/Header";
import { Video, FileText, MessageSquare, Archive, ChevronDown, ChevronUp } from "lucide-react";
import api from "../api/axios";
import { useAlert } from "../hooks/useAlert.jsx";
import socket from "../socket";

// Import components from organized structure
import {
  PetTipsSection,
  PetTipModal,
  VideosSection,
  VideoModal,
} from "../components/content-management";
import ForumPostsSection from "../components/content-management/ForumPostsSection";

const ContentManagement = () => {
  const { showSuccess, showError, showConfirm, showToast, AlertComponent } = useAlert();
  const [activeTab, setActiveTab] = useState("pet-tips");
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

  const [forumPosts, setForumPosts] = useState([]);

  // Stats state
  const [stats, setStats] = useState({
    publishedTips: 0,
    publishedVideos: 0,
    archives: 0,
    forumPosts: 0
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

  // Fetch forum posts (admin content management)
  const fetchForumPosts = async () => {
    try {
      const response = await api.get('/admin/content/forum-posts');
      setForumPosts(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      showError(error.response?.data?.message || 'Failed to fetch forum posts', {
        title: 'Data Notice'
      });
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
    fetchForumPosts();
  }, []);

  useEffect(() => {
    const onForumPostDeleted = ({ postId }) => {
      const id = Number(postId);
      if (!id) return;
      setForumPosts((prev) => prev.filter((post) => post.id !== id));
    };

    const onForumPostStatusUpdated = ({ postId, status }) => {
      const id = Number(postId);
      if (!id || !status) return;
      setForumPosts((prev) =>
        prev.map((post) => (post.id === id ? { ...post, status } : post))
      );
    };

    socket.on('delete_forum_post', onForumPostDeleted);
    socket.on('forum_post_status_updated', onForumPostStatusUpdated);

    return () => {
      socket.off('delete_forum_post', onForumPostDeleted);
      socket.off('forum_post_status_updated', onForumPostStatusUpdated);
    };
  }, []);

  // Update stats when data changes
  useEffect(() => {
    updateStats();
  }, [petTips, videos, forumPosts]);

  // Update stats
  const updateStats = () => {
    const publishedTips = petTips.filter(tip => tip.status === "Published").length;
    const publishedVideos = videos.filter(video => video.status === "Published").length;
    const archives = petTips.filter(tip => tip.status === "Archived").length + 
                    videos.filter(video => video.status === "Archived").length;
    
    setStats({
      publishedTips,
      publishedVideos,
      archives,
      forumPosts: forumPosts.length
    });
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
        showSuccess(response.data.message || 'Pet tip saved successfully!', {
          title: 'Success'
        });
      } else {
        showError(response.data.message || 'Failed to save pet tip', {
          title: 'Save Failed'
        });
      }
    } catch (error) {
      console.error('Error saving pet tip:', error);
      showError(getApiErrorMessage(error, 'Failed to save pet tip'), {
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
          showSuccess('Pet tip deleted successfully!', {
            title: 'Deleted'
          });
        } else {
          showError(response.data.message || 'Failed to delete pet tip', {
            title: 'Delete Failed'
          });
        }
      } catch (error) {
        console.error('Error deleting pet tip:', error);
        showError(error.response?.data?.message || 'Failed to delete pet tip', {
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

  // Forum post handlers
  const handleDeleteForumPost = async (id) => {
    showConfirm(
      'Are you sure you want to delete this forum post? This action cannot be undone.',
      async () => {
        try {
          setLoading(true);
          const response = await api.delete(`/admin/content/forum-posts/${id}`);
          if (response.data?.success) {
            setForumPosts(prevPosts => prevPosts.filter(post => post.id !== id));
            showSuccess('Forum post deleted successfully!', {
              title: 'Deleted'
            });
          } else {
            showError(response.data?.message || 'Failed to delete forum post', {
              title: 'Delete Failed'
            });
          }
        } catch (error) {
          console.error('Error deleting forum post:', error);
          showError(error.response?.data?.message || 'Failed to delete forum post', {
            title: 'Action Needed'
          });
        } finally {
          setLoading(false);
        }
      },
      {
        title: 'Delete Forum Post',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    );
  };

  const handleArchiveForumPost = async (id, newStatus) => {
    const confirmText = newStatus === 'active'
      ? 'Are you sure you want to restore this forum post?'
      : 'Are you sure you want to archive this forum post?';

    showConfirm(
      confirmText,
      async () => {
        try {
          const response = await api.patch(`/admin/content/forum-posts/${id}/status`, {
            status: newStatus,
          });

          if (response.data?.success) {
            setForumPosts(prevPosts =>
              prevPosts.map(post =>
                post.id === id ? { ...post, status: newStatus } : post
              )
            );
            showSuccess(
              newStatus === 'active'
                ? 'The forum post has been restored and is now active.'
                : 'The forum post has been archived successfully.',
              {
                title: newStatus === 'active' ? 'Post Restored' : 'Post Archived',
                confirmText: 'Done',
                showCancel: false,
              }
            );
          } else {
            showError(response.data?.message || 'Failed to update forum post status', {
              title: 'Update Failed'
            });
          }
        } catch (error) {
          console.error('Error updating forum post status:', error);
          showError(error.response?.data?.message || 'Failed to update forum post status', {
            title: 'Action Needed'
          });
        }
      },
      {
        title: newStatus === 'active' ? 'Restore Forum Post' : 'Archive Forum Post',
        confirmText: newStatus === 'active' ? 'Restore' : 'Archive',
        cancelText: 'Cancel'
      }
    );
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
                <p className="text-blue-600 text-sm font-semibold">Published Tips</p>
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
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200 transform transition-transform duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-semibold">Forum Posts</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.forumPosts}</p>
              </div>
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <MessageSquare className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-2 relative">
        {[
          { id: "pet-tips", name: "Pet Tips", icon: FileText },
          { id: "videos", name: "Videos", icon: Video },
          { id: "forum-posts", name: "Forum Posts", icon: MessageSquare }
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
        {/* Pet Tips Tab */}
        {activeTab === "pet-tips" && (
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

        {/* Forum Posts Tab */}
        {activeTab === "forum-posts" && (
          <ForumPostsSection
            posts={forumPosts}
            onDelete={handleDeleteForumPost}
            onArchive={handleArchiveForumPost}
            showConfirm={showConfirm}
            showSuccess={showSuccess}
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
