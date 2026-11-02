import { AlertTriangle, X } from "lucide-react";

const DeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  item, 
  loading, 
  type = "tip",
  itemName = "item" 
}) => {
  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'video':
        return {
          title: 'Delete Video',
          message: 'Are you sure you want to delete this video? This action cannot be undone.',
          confirmText: 'Delete Video'
        };
      case 'tip':
      default:
        return {
          title: 'Delete Tip', 
          message: 'Are you sure you want to delete this pet tip? This action cannot be undone.',
          confirmText: 'Delete Tip'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">{config.title}</h2>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-4">
            {config.message}
          </p>
          
          {item && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
              {item.shortDescription && (
                <p className="text-sm text-gray-600">{item.shortDescription}</p>
              )}
              <div className="flex gap-2 mt-2">
                <span className="inline-block px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  {item.category}
                </span>
                <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                  item.status === "Published" ? "bg-green-100 text-green-800" :
                  item.status === "Draft" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {item.status}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(item?.id)}
            disabled={loading}
            className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              config.confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;