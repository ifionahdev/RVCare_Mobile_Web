import { useState } from "react";
import { 
  Search, Filter, Trash2, Phone, Mail, Calendar,
  Image as ImageIcon, Archive, ArchiveRestore,
  Eye, ChevronDown, X, AlertCircle, CheckCircle,
  MessageCircle
} from "lucide-react";

const ForumPostsSection = ({ 
  posts, 
  onDelete, 
  onArchive,
  showConfirm,
  showSuccess 
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedPost, setSelectedPost] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const types = ["All", "Lost", "Found"];
  const statuses = ["All", "Active", "Archived"];

  const safePosts = Array.isArray(posts) ? posts : [];
  
  const filteredPosts = safePosts.filter(post => {
    if (!post) return false;
    
    const description = post.description || "";
    const type = post.type || "";
    const status = post.status || "active";
    
    const matchesSearch = description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "All" || type === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === "All" || status === statusFilter.toLowerCase();
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadge = (type) => {
    return type === "lost" ? (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        Lost Pet
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Found Pet
      </span>
    );
  };

  const getStatusBadge = (status) => {
    return status === "archived" ? (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
        <Archive className="w-3 h-3 mr-1" />
        Archived
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#5EE6FE]/10 text-[#5EE6FE] border border-[#5EE6FE]/20">
        <MessageCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getImageSrc = (image) => {
    if (!image) return "";
    if (typeof image === "string") return image;
    if (typeof image === "object") return image.url || image.imageUrl || image.src || "";
    return "";
  };

  const PostModal = ({ post, onClose }) => {
    if (!post) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-xl border border-gray-200">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getTypeBadge(post.type)}
              {getStatusBadge(post.status)}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {post.type === "lost" ? "Lost Pet Report" : "Found Pet Report"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Posted {formatDate(post.date)}</p>
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-[#5EE6FE]" />
                  Description
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {post.description || "No description available"}
                  </p>
                </div>
              </div>

              {/* Images Section */}
              {post?.images && post.images.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-[#5EE6FE]" />
                    Images ({post.images.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {post.images.map((image, index) => (
                      <div 
                        key={index}
                        className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer hover:border-[#5EE6FE] transition-colors"
                      >
                        {getImageSrc(image) ? (
                          <img
                            src={getImageSrc(image)}
                            alt={`Forum post image ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  Contact Information
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#5EE6FE]/20 flex items-center justify-center text-[#5EE6FE] font-semibold text-sm">
                      {post.anonymous ? 'A' : (post.realName?.[0] || 'U')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {post.anonymous ? "Anonymous User" : (post.realName || "Unknown User")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {post?.contactNumber && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{post.contactNumber}</span>
                      </div>
                    )}
                    {post?.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{post.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#5EE6FE]" />
                  Post Details
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Post ID</p>
                      <p className="font-medium text-gray-900">#{post.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className="font-medium text-gray-900 capitalize">{post.status}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="font-medium text-gray-900 capitalize">{post.type}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Posted on</p>
                      <p className="font-medium text-gray-900">{new Date(post.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3">
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  onArchive(post.id, post.status === "archived" ? "active" : "archived");
                  onClose();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                  post.status === "archived" 
                    ? "bg-green-600 text-white hover:bg-green-700" 
                    : "bg-[#5EE6FE] text-gray-900 hover:bg-[#4fd9f0]"
                }`}
              >
                {post.status === "archived" ? (
                  <>
                    <ArchiveRestore size={16} />
                    Restore
                  </>
                ) : (
                  <>
                    <Archive size={16} />
                    Archive
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  onDelete(post.id);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Modern Search & Filter Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Search Bar */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-transparent border-none focus:outline-none focus:ring-0 text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="border-t border-gray-100">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span>Filters</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Expandable Filters */}
          <div className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-20 border-t border-gray-100' : 'max-h-0'}`}>
            <div className="p-3 grid grid-cols-2 gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50 focus:border-[#5EE6FE]"
              >
                <option value="All">All Types</option>
                {types.filter(type => type !== "All").map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50 focus:border-[#5EE6FE]"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredPosts.length}</span> of <span className="font-semibold text-gray-900">{safePosts.length}</span> posts
        </p>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-[#5EE6FE]/10 text-[#5EE6FE] rounded-full text-xs font-medium flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            Active: {safePosts.filter(p => p?.status === 'active').length}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1">
            <Archive className="h-3 w-3" />
            Archived: {safePosts.filter(p => p?.status === 'archived').length}
          </span>
        </div>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-500">
              {searchQuery || typeFilter !== "All" || statusFilter !== "All"
                ? "Try adjusting your search or filters"
                : "No forum posts available yet"
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div 
              key={post?.id || Math.random()} 
              onClick={() => setSelectedPost(post)}
              className={`group relative bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden ${
                post?.status === "archived" 
                  ? "border-gray-200 opacity-80 hover:opacity-100" 
                  : "border-gray-200 hover:border-[#5EE6FE]"
              }`}
            >
              {/* Card Header with Status Indicator */}
              <div className={`h-1 w-full ${
                post?.status === "archived" 
                  ? "bg-gray-300" 
                  : post?.type === "lost" 
                    ? "bg-orange-400" 
                    : "bg-green-400"
              }`} />

              {/* Card Content */}
              <div className="p-5">
                {/* Top Row - Type and Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-2">
                    {getTypeBadge(post?.type)}
                  </div>
                  {getStatusBadge(post?.status)}
                </div>

                {/* Description Preview */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {post?.description || "No description available"}
                  </p>
                </div>

                {/* Image Previews */}
                {post?.images && post.images.length > 0 && (
                  <div className="flex -space-x-2 mb-3">
                    {post.images.slice(0, 3).map((_, index) => (
                      <div 
                        key={index}
                        className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center"
                      >
                        <ImageIcon className="h-3 w-3 text-gray-500" />
                      </div>
                    ))}
                    {post.images.length > 3 && (
                      <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                        +{post.images.length - 3}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer with Date and Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(post?.date)}</span>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newStatus = post?.status === "archived" ? "active" : "archived";
                        onArchive(post?.id, newStatus);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        post?.status === "archived" 
                          ? "bg-green-50 text-green-600 hover:bg-green-100" 
                          : "bg-[#5EE6FE]/10 text-[#5EE6FE] hover:bg-[#5EE6FE]/20"
                      }`}
                    >
                      {post?.status === "archived" ? (
                        <ArchiveRestore size={14} />
                      ) : (
                        <Archive size={14} />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(post?.id);
                      }}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedPost && (
        <PostModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
        />
      )}
    </div>
  );
};

export default ForumPostsSection;