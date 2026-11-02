export default function ErrorToast({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed right-4 top-4 z-50 rounded-lg bg-red-600 px-4 py-3 text-sm text-white shadow-lg">
      <button type="button" className="mr-3 font-bold" onClick={onClose}>×</button>
      {message}
    </div>
  );
}
