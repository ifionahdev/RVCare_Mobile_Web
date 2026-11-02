import { Edit2, Trash2 } from "lucide-react";

const OwnerTable = ({ owners, searchQuery, setSelectedOwner, handleEdit, setShowDeleteModal, setDeleteTarget }) => {
  const filteredOwners = owners.filter(o =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <table className="w-full text-left border-collapse">
      <thead className="bg-gray-100 dark:bg-[#1B1B1B] sticky top-0">
        <tr>
          <th className="p-2 text-sm text-gray-600 dark:text-gray-300">ID</th>
          <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Name</th>
          <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Email</th>
          <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Phone</th>
          <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredOwners.map(owner => (
          <tr key={owner.id} className="cursor-pointer hover:bg-[#E5FBFF] dark:hover:bg-[#222] transition" onClick={() => setSelectedOwner(owner)}>
            <td className="p-2 text-sm">{owner.id}</td>
            <td className="p-2 text-sm">{owner.name}</td>
            <td className="p-2 text-sm">{owner.email}</td>
            <td className="p-2 text-sm">{owner.phone}</td>
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
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default OwnerTable;
