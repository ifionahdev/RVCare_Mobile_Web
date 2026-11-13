import { Toast } from "../AlertModal.jsx";

export default function ErrorToast({ message, onClose }) {
  if (!message) return null;
  return <Toast message={message} type="error" onClose={onClose} />;
}
