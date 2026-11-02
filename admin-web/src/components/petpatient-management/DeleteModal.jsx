import { useState } from "react";
import api from "../../api/axios";

const DeleteModal = ({ isOpen, onClose, onDelete, itemType, deleteTarget, refreshData }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSoftDelete = async () => {
    if (!deleteTarget) return;
    
    setIsLoading(true);
    try {
      let endpoint = "";
      let method = "delete"; // Default to DELETE method
      
      // Determine the endpoint based on item type
      switch (deleteTarget.type) {
        case "owner":
          endpoint = `admin/soft-delete-owner/${deleteTarget.id}`;
          method = "put"; // Use PUT for soft delete
          break;
        case "pet":
          endpoint = `admin/soft-delete-pet/${deleteTarget.id}`;
          method = "put"; // Use PUT for soft delete
          break;
        case "record":
          endpoint = `admin/pet-records/${deleteTarget.id}`; // Use the correct endpoint
          method = "delete"; // Use DELETE method
          break;
        default:
          console.error("Unknown item type for deletion");
          return;
      }

      // Make API call with appropriate method
      if (method === "delete") {
        await api.delete(endpoint);
      } else {
        await api.put(endpoint);
      }
      
      // Call the parent's onDelete function to update UI
      onDelete(deleteTarget.id, deleteTarget.type);
      
      // Refresh data if refresh function is provided
      if (refreshData) {
        refreshData();
      }
      
    } catch (error) {
      console.error(`Error soft deleting ${itemType}:`, error);
      alert(`Failed to delete ${itemType}. Please try again.`);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 w-96 shadow-xl flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Confirm Delete</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete this {itemType}? This action can be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSoftDelete}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;