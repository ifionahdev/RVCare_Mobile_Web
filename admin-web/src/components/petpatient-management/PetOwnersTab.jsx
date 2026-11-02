import { Edit2, Trash2 } from "lucide-react";

const formatPhoneDisplay = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "-";

  if (digits.length === 10) {
    return `+63${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `+63${digits.slice(1)}`;
  }

  if (digits.length >= 12 && digits.startsWith("63")) {
    return `+${digits.slice(0, 12)}`;
  }

  return value;
};

const PetOwnersTab = ({ 
  filteredOwners, 
  setSelectedOwner, 
  handleEdit, 
  setDeleteTarget, 
  setShowDeleteModal,
  isVetView = false 
}) => {
  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100 dark:bg-[#1B1B1B] sticky top-0 z-10">
          <tr>
            <th className="p-2 text-sm text-gray-600 dark:text-gray-300">ID</th>
            <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Name</th>
            <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Email</th>
            <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Phone</th>
            {!isVetView && <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredOwners.map(owner => (
            <tr 
              key={owner.id} 
              className="cursor-pointer hover:bg-[#E5FBFF] dark:hover:bg-[#222] transition" 
              onClick={() => setSelectedOwner(owner)}
            >
              <td className="p-2 text-sm">{owner.id}</td>
              <td className="p-2 text-sm">{owner.name}</td>
              <td className="p-2 text-sm">{owner.email}</td>
              <td className="p-2 text-sm">{formatPhoneDisplay(owner.phone)}</td>
              {!isVetView && (
                <td className="p-2 text-sm flex gap-2">
                  <Edit2
                    size={16}
                    className="text-blue-500 cursor-pointer hover:text-blue-600"
                    onClick={e => { e.stopPropagation(); handleEdit(owner, "owner"); }}
                  />
                  <Trash2
                    size={16}
                    className="text-red-500 cursor-pointer hover:text-red-600"
                    onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'owner', id: owner.id }); setShowDeleteModal(true); }}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PetOwnersTab;