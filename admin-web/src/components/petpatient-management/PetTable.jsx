import { Edit2, Trash2 } from "lucide-react";

const PetTable = ({ pets, searchQuery, setSelectedPet, handleEdit, setShowDeleteModal, setDeleteTarget }) => {
  const filteredPets = pets.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <table className="w-full text-left border-collapse">
      <thead className="bg-gray-100 dark:bg-[#1B1B1B] sticky top-0">
        <tr>
          <th className="p-2 text-sm text-gray-600 dark:text-gray-300">ID</th>
          <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Name</th>
          <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Type</th>
          <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Owner</th>
          <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredPets.map(pet => (
          <tr key={pet.id} className="cursor-pointer hover:bg-[#E5FBFF] dark:hover:bg-[#222] transition" onClick={() => setSelectedPet(pet)}>
            <td className="p-2 text-sm">{pet.id}</td>
            <td className="p-2 text-sm">{pet.name}</td>
            <td className="p-2 text-sm">{pet.type}</td>
            <td className="p-2 text-sm">{pet.owner}</td>
            <td className="p-2 text-sm flex gap-2">
              <Edit2
                size={16}
                className="text-blue-500 cursor-pointer hover:text-blue-600"
                onClick={e => { e.stopPropagation(); handleEdit(pet, "pet"); }}
              />
              <Trash2
                size={16}
                className="text-red-500 cursor-pointer hover:text-red-600"
                onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'pet', id: pet.id }); setShowDeleteModal(true); }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PetTable;
