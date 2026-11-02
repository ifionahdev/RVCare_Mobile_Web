import { useState, useEffect } from "react";
import { 
  Plus, Edit2, Trash2, Search, Video, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import socket from "../../socket";

import DeleteModal from "./DeleteTipModal";

const VideosSection = ({ 
  videos, 
  onAdd, 
  onEdit, 
  onDelete, 
  onRefresh,
  loading, 
  allCategories = [], 
  allStatuses = [],
  currentAdminId,
  currentAdminName,
  showConfirm,
  showSuccess,
  showError
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);
  
  // Real-time collaboration states
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showUpdateIndicator, setShowUpdateIndicator] = useState(false);

  // WebSocket setup
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const joinAdminRoom = () => {
      socket.emit('join_admin_room', {
        adminId: currentAdminId,
        adminName: currentAdminName,
        role: 2,
      });
    };

    const onAdminVideoCreated = (data) => {
      setShowUpdateIndicator(true);
      setLastUpdate({
        action: 'created',
        video: data.video,
        adminName: data.adminName,
        timestamp: new Date().toLocaleTimeString()
      });
      
      setTimeout(() => {
        if (onRefresh) onRefresh();
        setShowUpdateIndicator(false);
      }, 1000);
    };

    const onAdminVideoUpdated = (data) => {
      setShowUpdateIndicator(true);
      setLastUpdate({
        action: 'updated',
        video: data.video,
        adminName: data.adminName,
        timestamp: new Date().toLocaleTimeString()
      });
      
      setTimeout(() => {
        if (onRefresh) onRefresh();
        setShowUpdateIndicator(false);
      }, 1000);
    };

    const onAdminVideoDeleted = (data) => {
      setShowUpdateIndicator(true);
      setLastUpdate({
        action: 'deleted',
        videoTitle: data.videoTitle,
        adminName: data.adminName,
        timestamp: new Date().toLocaleTimeString()
      });
      
      if (videoToDelete?.id === data.videoId) {
        setDeleteModalOpen(false);
        setVideoToDelete(null);
      }
      
      setTimeout(() => {
        if (onRefresh) onRefresh();
        setShowUpdateIndicator(false);
      }, 1000);
    };

    socket.on('admin_video_created', onAdminVideoCreated);
    socket.on('admin_video_updated', onAdminVideoUpdated);
    socket.on('admin_video_deleted', onAdminVideoDeleted);
    socket.on('connect', joinAdminRoom);

    if (socket.connected) {
      joinAdminRoom();
    }

    return () => {
      socket.off('admin_video_created', onAdminVideoCreated);
      socket.off('admin_video_updated', onAdminVideoUpdated);
      socket.off('admin_video_deleted', onAdminVideoDeleted);
      socket.off('connect', joinAdminRoom);
    };
  }, [currentAdminId, currentAdminName, onRefresh, videoToDelete]);

  const categories = ["All", ...(allCategories.length > 0 
    ? allCategories.map(cat => cat.name || cat.videoCategory) 
    : [...new Set(videos.map(video => video.category).filter(Boolean))]
  )];

  const statuses = ["All", ...(allStatuses.length > 0 
    ? allStatuses.map(status => status.name || status.pubStatus) 
    : [...new Set(videos.map(video => video.status).filter(Boolean))]
  )];

  const getCategoryCount = (categoryName) => {
    if (categoryName === "All") return videos.length;
    return videos.filter(video => video.category === categoryName).length;
  };

  const getStatusCount = (statusName) => {
    if (statusName === "All") return videos.length;
    return videos.filter(video => video.status === statusName).length;
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || video.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || video.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Published": return "bg-green-100 text-green-800";
      case "Draft": return "bg-yellow-100 text-yellow-800";
      case "Archived": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const handleDeleteClick = (video) => {
    showConfirm(
      'Are you sure you want to delete this video? This action cannot be undone.',
      () => {
        setVideoToDelete(video);
        setDeleteModalOpen(true);
      },
      {
        title: 'Delete Video',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    );
  };

  const handleConfirmDelete = () => {
    if (videoToDelete) {
      onDelete(videoToDelete.id);
      setDeleteModalOpen(false);
      setVideoToDelete(null);
    }
  };

  return (
    <div className="relative">
      {/* Real-time Update Indicator */}
      <AnimatePresence>
        {showUpdateIndicator && lastUpdate && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4 animate-spin" />
            <div className="text-sm">
              <strong>{lastUpdate.adminName}</strong> {lastUpdate.action} 
              {lastUpdate.action === 'deleted' 
                ? ` "${lastUpdate.videoTitle}"` 
                : ` "${lastUpdate.video?.title}"`} 
              <span className="text-xs opacity-75 ml-2">{lastUpdate.timestamp}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4 flex-wrap items-center justify-between">
        <div className="flex gap-2 items-center flex-wrap">
          {/* Search Bar */}
          <div className="relative min-w-[180px] max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 p-2 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 w-48 focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50"
          >
            {categories.map((category) => {
              const count = getCategoryCount(category);
              return (
                <option key={category} value={category}>
                  {category === "All" ? `All Categories (${count})` : `${category} (${count})`}
                </option>
              );
            })}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 w-48 focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50"
          >
            {statuses.map((status) => {
              const count = getStatusCount(status);
              return (
                <option key={status} value={status}>
                  {status === "All" ? `All Status (${count})` : `${status} (${count})`}
                </option>
              );
            })}
          </select>
        </div>

        <button
          onClick={onAdd}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          <span>Add New</span>
        </button>
      </div>

      {/* Results Info */}
      <div className="mb-4 text-sm text-gray-600 flex items-center justify-between">
        <div>
          Showing {filteredVideos.length} of {videos.length} videos
          {categoryFilter !== "All" && ` in "${categoryFilter}"`}
          {statusFilter !== "All" && ` with status "${statusFilter}"`}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
        
        {/* Last update indicator */}
        {lastUpdate && !showUpdateIndicator && (
          <div className="text-xs text-gray-400">
            Last update: {lastUpdate.timestamp}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && videos.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          Loading videos...
        </div>
      )}

      {/* Table */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-sm text-gray-600 font-semibold">Video</th>
              <th className="p-3 text-sm text-gray-600 font-semibold">Category</th>
              <th className="p-3 text-sm text-gray-600 font-semibold">Status</th>
              <th className="p-3 text-sm text-gray-600 font-semibold">Last Updated</th>
              <th className="p-3 text-sm text-gray-600 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filteredVideos.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-6 text-gray-400">
                  {videos.length === 0 ? "No videos found. Click 'Add New' to create one." : "No videos match your search criteria."}
                </td>
              </tr>
            ) : (
              filteredVideos.map((video) => (
                <tr
                  key={video.id}
                  className={`border-t border-gray-100 hover:bg-gray-50 transition ${
                    lastUpdate?.video?.id === video.id && lastUpdate?.action === 'updated' 
                      ? 'bg-yellow-50' 
                      : ''
                  }`}
                >
                  <td className="p-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
                        <Video className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{video.title}</div>
                        {lastUpdate?.video?.id === video.id && lastUpdate?.action === 'updated' && (
                          <div className="text-xs text-yellow-600 mt-1">
                            Updated by {lastUpdate.adminName} at {lastUpdate.timestamp}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm">
                    <span className="inline-block px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {video.category || "Uncategorized"}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(video.status)}`}>
                      {video.status || "Draft"}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {formatDate(video.updated_at || video.updatedAt || video.created_at || video.createdAt)}
                  </td>
                  <td className="p-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(video)}
                        disabled={loading}
                        className="text-blue-500 hover:text-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(video)}
                        disabled={loading}
                        className="text-red-500 hover:text-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        item={videoToDelete}
        loading={loading}
        type="video"
      />
    </div>
  );
};

export default VideosSection;