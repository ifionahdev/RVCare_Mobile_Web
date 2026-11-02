import { X, AlertTriangle, CheckCircle, Info, AlertCircle, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

const AlertModal = ({ 
  isOpen, 
  onClose, 
  type = "info", // info, success, warning, error, confirm
  title, 
  message,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  showCancel = true
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case "error":
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      case "confirm":
        return <AlertTriangle className="h-6 w-6 text-orange-600" />;
      case "info":
      default:
        return <Info className="h-6 w-6 text-blue-600" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          iconBg: "bg-green-100",
          button: "bg-green-600 hover:bg-green-700",
          text: "text-green-800"
        };
      case "warning":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          iconBg: "bg-yellow-100",
          button: "bg-yellow-600 hover:bg-yellow-700",
          text: "text-yellow-800"
        };
      case "error":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          iconBg: "bg-red-100",
          button: "bg-red-600 hover:bg-red-700",
          text: "text-red-800"
        };
      case "confirm":
        return {
          bg: "bg-orange-50",
          border: "border-orange-200",
          iconBg: "bg-orange-100",
          button: "bg-orange-600 hover:bg-orange-700",
          text: "text-orange-800"
        };
      case "info":
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          iconBg: "bg-blue-100",
          button: "bg-blue-600 hover:bg-blue-700",
          text: "text-blue-800"
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={type === "confirm" ? null : onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border ${colors.border}`}
          >
            {/* Header with accent color */}
            <div className={`h-2 w-full ${colors.bg} border-b ${colors.border}`} />

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
                  {getIcon()}
                </div>

                {/* Text */}
                <div className="flex-1 pt-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {message}
                  </p>
                </div>

                {/* Close button (only for non-confirm modals) */}
                {type !== "confirm" && (
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={18} className="text-gray-400" />
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                {showCancel && (
                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  onClick={onConfirm}
                  className={`px-4 py-2.5 ${colors.button} text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md flex items-center gap-2`}
                >
                  {type === "confirm" && <Check size={16} />}
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Toast notification for brief messages
export const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-600",
          icon: <CheckCircle className="h-5 w-5 text-white" />
        };
      case "error":
        return {
          bg: "bg-red-600",
          icon: <AlertCircle className="h-5 w-5 text-white" />
        };
      case "warning":
        return {
          bg: "bg-yellow-600",
          icon: <AlertTriangle className="h-5 w-5 text-white" />
        };
      case "info":
      default:
        return {
          bg: "bg-blue-600",
          icon: <Info className="h-5 w-5 text-white" />
        };
    }
  };

  const styles = getToastStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: 50, x: "-50%" }}
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] ${styles.bg} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md`}
    >
      {styles.icon}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-white/80 hover:text-white">
        <X size={16} />
      </button>
    </motion.div>
  );
};

export default AlertModal;