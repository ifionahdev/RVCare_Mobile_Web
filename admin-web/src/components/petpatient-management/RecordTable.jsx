import { Edit2, Trash2 } from "lucide-react";

const RecordTable = ({ records, setSelectedRecord, handleEditRecord, handleDeleteRecordClick }) => {
  const isRecordUploaded = (record) => {
    if (typeof record?.isUploaded === 'boolean') return record.isUploaded;
    if (typeof record?.recordStatus === 'string') return record.recordStatus.toLowerCase() === 'uploaded';
    return Boolean(record?.fileName || record?.storedName || record?.filePath || record?.originalName);
  };

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100 dark:bg-[#1B1B1B] sticky top-0">
          <tr>
            <th className="p-2 text-sm text-gray-600 dark:text-gray-300">ID</th>
            <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Pet Name</th>
            <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Owner</th>
            <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Type</th>
            <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Uploaded On</th>
            <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr className="hover:bg-[#E5FBFF] dark:hover:bg-[#222] transition">
              <td colSpan={6} className="text-center p-4 text-gray-400 dark:text-gray-500">
                No records yet
              </td>
            </tr>
          ) : (
            records.map(record => {
              const isUploaded = isRecordUploaded(record);

              return (
                <tr
                  key={record.id}
                  className="hover:bg-[#E5FBFF] dark:hover:bg-[#222] transition cursor-pointer"
                  onClick={() => setSelectedRecord(record)}
                >
                  <td className="p-2 text-sm">{record.id}</td>
                  <td className="p-2 text-sm">{record.petName}</td>
                  <td className="p-2 text-sm">{record.owner}</td>
                  <td className="p-2 text-sm">{record.type}</td>
                  <td className="p-2 text-sm">{record.uploadedOn}</td>
                  <td className="p-2 text-sm flex gap-2">
                    {!isUploaded && (
                      <Edit2
                        size={16}
                        className="text-blue-500 cursor-pointer hover:text-blue-600"
                        onClick={e => { e.stopPropagation(); handleEditRecord(record); }}
                      />
                    )}
                    <Trash2
                      size={16}
                      className="text-red-500 cursor-pointer hover:text-red-600"
                      onClick={e => { e.stopPropagation(); handleDeleteRecordClick(record); }}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RecordTable;
