import { useState, useCallback } from 'react';
import AlertModal, { Toast } from '../components/AlertModal.jsx';
import { AnimatePresence } from 'framer-motion';

export const useAlert = () => {
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    showCancel: true
  });

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const showAlert = useCallback((options) => {
    setAlert({
      isOpen: true,
      type: options.type || 'info',
      title: options.title || '',
      message: options.message || '',
      onConfirm: options.onConfirm || (() => {}),
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      showCancel: options.showCancel !== false
    });
  }, []);

  const showSuccess = useCallback((message, options = {}) => {
    showAlert({
      type: 'success',
      title: options.title || 'Success',
      message,
      ...options
    });
  }, [showAlert]);

  const showError = useCallback((message, options = {}) => {
    showAlert({
      type: 'error',
      title: options.title || 'Please Review',
      message,
      ...options
    });
  }, [showAlert]);

  const showWarning = useCallback((message, options = {}) => {
    showAlert({
      type: 'warning',
      title: options.title || 'Warning',
      message,
      ...options
    });
  }, [showAlert]);

  const showInfo = useCallback((message, options = {}) => {
    showAlert({
      type: 'info',
      title: options.title || 'Information',
      message,
      ...options
    });
  }, [showAlert]);

  const showConfirm = useCallback((message, onConfirm, options = {}) => {
    showAlert({
      type: 'confirm',
      title: options.title || 'Confirm Action',
      message,
      onConfirm,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      showCancel: true
    });
  }, [showAlert]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  const AlertComponent = useCallback(() => (
    <>
      <AlertModal
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={() => {
          alert.onConfirm();
          hideAlert();
        }}
        onClose={hideAlert}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        showCancel={alert.showCancel}
      />
      
      <AnimatePresence>
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
      </AnimatePresence>
    </>
  ), [alert, toast, hideAlert, hideToast]);

  return {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showToast,
    AlertComponent
  };
};