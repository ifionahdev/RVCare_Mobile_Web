import { Toast } from "../AlertModal.jsx";

export default function SuccessToast({ message, onClose }) {
  if (!message) return null;
  return <Toast message={message} type="success" onClose={onClose} />;
}
