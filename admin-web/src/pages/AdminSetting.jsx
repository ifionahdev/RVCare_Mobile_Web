import React, { useEffect, useState } from "react";
import Header from "../components/template/Header";
import api from "../api/axios";
import {
  UserPlus,
  Edit,
  Trash2,
  X,
  Shield,
  BriefcaseMedical,
  Search,
  Mail,
} from "lucide-react";
import { useAlert } from "../hooks/useAlert.jsx";

const AdminSettings = () => {
  const userRole = Number(localStorage.getItem('userRole') || 0);
  const canManageUsers = userRole === 2;
  const { showSuccess, showError, showWarning, showInfo, AlertComponent } = useAlert();

  const [activeTab, setActiveTab] = useState("admins");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addErrors, setAddErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  const [admins, setAdmins] = useState([]);
  const [veterinarians, setVeterinarians] = useState([]);

  const [newUser, setNewUser] = useState({
    type: "admin",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const nameRegex = /^[\p{L}\p{M}]+(?:[ '\-][\p{L}\p{M}]+)*$/u;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const phoneRegex = /^9\d{9}$/;

  const normalizePhoneInput = (value = '') => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';

    if (digits.startsWith('63') && digits.length >= 12) {
      return digits.slice(2, 12);
    }

    if (digits.startsWith('0') && digits.length >= 11) {
      return digits.slice(1, 11);
    }

    if (digits.length > 10) {
      return digits.slice(-10);
    }

    return digits;
  };

  const formatPhoneDisplay = (digits = '') => {
    const normalizedDigits = normalizePhoneInput(digits);
    return normalizedDigits ? `+63${normalizedDigits}` : '-';
  };

  const validateUserPayload = ({ firstName, lastName, email, phone }) => {
    const errors = {};

    if (!nameRegex.test((firstName || '').trim())) {
      errors.firstName = 'First name should contain letters only.';
    }

    if (!nameRegex.test((lastName || '').trim())) {
      errors.lastName = 'Last name should contain letters only.';
    }

    if (!emailRegex.test((email || '').trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    const phoneDigits = normalizePhoneInput(phone || '');
    if (!phoneRegex.test(phoneDigits)) {
      errors.phone = 'Phone number must be 10 digits and start with 9.';
    }

    return errors;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/settings/users');
      if (response.data?.success) {
        setAdmins(response.data.data?.admins || []);
        setVeterinarians(response.data.data?.veterinarians || []);
      }
    } catch (error) {
      console.error('Failed to load admin settings users:', error);
      const status = error?.response?.status;
      if (status === 401) {
        showError('Session expired. Please log in again.', { title: 'Session Expired' });
      } else if (status === 403) {
        showError('You do not have permission to access user management.', { title: 'Access Denied' });
      } else if (status === 404) {
        showError('Admin settings API route not found. Please restart backend server.', { title: 'Not Found' });
      } else {
        showError(error?.response?.data?.message || 'Failed to load users', { title: 'Load Failed' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredAdmins = admins.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVeterinarians = veterinarians.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // add new user
  const handleAddUser = async () => {
    if (!canManageUsers) {
      showWarning('Only admins can add users.', { title: 'Permission Denied' });
      return;
    }

    const validationErrors = validateUserPayload(newUser);
    if (Object.keys(validationErrors).length > 0) {
      setAddErrors(validationErrors);
      return;
    }
    setAddErrors({});

    setSubmitting(true);
    try {
      const phoneDigits = normalizePhoneInput(newUser.phone);
      const payload = {
        type: newUser.type,
        firstName: newUser.firstName.trim(),
        lastName: newUser.lastName.trim(),
        email: newUser.email.trim(),
        phone: phoneDigits,
      };

      const response = await api.post('/admin/settings/users', payload);

      if (response.data?.success) {
        const createdUser = response.data?.data;
        if (createdUser?.type === 'admin') {
          setAdmins((prev) => [createdUser, ...prev]);
        } else {
          setVeterinarians((prev) => [createdUser, ...prev]);
        }

        if (response.data.emailSent) {
            showSuccess(`Account created and credentials were sent to ${createdUser.email}.`, { title: 'User Created' });
        } else if (response.data.generatedPassword) {
          showInfo(`Email not sent. Temporary password for ${createdUser.email}: ${response.data.generatedPassword}`, { title: 'User Created (No Email)' });
        }
      }
    } catch (error) {
      console.error('Failed to add user:', error);
        const backendMessage = error?.response?.data?.message;
        showError(backendMessage || 'Failed to add user', { title: 'Add Failed' });
      return;
    } finally {
      setSubmitting(false);
    }

    setNewUser({
      type: "admin",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    });
    setShowAddModal(false);
  };

  // edit user
  const handleEditUser = async () => {
    if (!canManageUsers) {
      showWarning('Only admins can edit users.', { title: 'Permission Denied' });
      return;
    }

    const validationErrors = validateUserPayload(selectedUser || {});
    if (Object.keys(validationErrors).length > 0) {
      setEditErrors(validationErrors);
      return;
    }
    setEditErrors({});

    if (!selectedUser?.id) return;

    setSubmitting(true);
    try {
      const phoneDigits = normalizePhoneInput(selectedUser.phone || '');
      const payload = {
        firstName: selectedUser.firstName.trim(),
        lastName: selectedUser.lastName.trim(),
        email: selectedUser.email.trim(),
        phone: phoneDigits,
      };

      const response = await api.put(`/admin/settings/users/${selectedUser.id}`, payload);

      if (response.data?.success) {
        if (activeTab === "admins") {
          setAdmins(admins.map(admin => 
            admin.id === selectedUser.id ? { ...admin, ...payload } : admin
          ));
        } else {
          setVeterinarians(veterinarians.map(vet => 
            vet.id === selectedUser.id ? { ...vet, ...payload } : vet
          ));
        }
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      const backendMessage = error?.response?.data?.message;
      showError(backendMessage || 'Failed to update user', { title: 'Update Failed' });
      return;
    } finally {
      setSubmitting(false);
    }

    showSuccess('User updated successfully!', { title: 'Updated' });
    setShowEditModal(false);
    setSelectedUser(null);
  };

  // delete user
  const handleDeleteUser = async () => {
    if (!canManageUsers) {
      showWarning('Only admins can delete users.', { title: 'Permission Denied' });
      return;
    }

    if (!selectedUser?.id) return;

    setSubmitting(true);
    try {
      const response = await api.delete(`/admin/settings/users/${selectedUser.id}`);

      if (response.data?.success) {
        if (activeTab === "admins") {
          setAdmins(admins.filter(admin => admin.id !== selectedUser.id));
        } else {
          setVeterinarians(veterinarians.filter(vet => vet.id !== selectedUser.id));
        }
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      showError(error?.response?.data?.message || 'Failed to delete user', { title: 'Delete Failed' });
      return;
    } finally {
      setSubmitting(false);
    }

    showSuccess('User deleted successfully!', { title: 'Deleted' });
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  // admins table
  const renderAdminsTable = () => (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
      <table className="min-w-full">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Administrator
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-100 dark:divide-gray-900">
          {filteredAdmins.map((admin) => (
            <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {admin.firstName} {admin.lastName}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <Mail size={12} />
                      {admin.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  {formatPhoneDisplay(admin.phone)}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <button
                    disabled={!canManageUsers}
                    onClick={() => {
                      setSelectedUser(admin);
                      setShowEditModal(true);
                    }}
                    className="p-2 text-gray-500 hover:text-[#5EE6FE] dark:text-gray-400 dark:hover:text-[#5EE6FE] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    disabled={!canManageUsers}
                    onClick={() => {
                      setSelectedUser(admin);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!loading && filteredAdmins.length === 0 && (
            <tr>
              <td colSpan="3" className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No administrators found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // veterinarians table
  const renderVeterinariansTable = () => (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
      <table className="min-w-full">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Veterinarian
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-100 dark:divide-gray-900">
          {filteredVeterinarians.map((vet) => (
            <tr key={vet.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {vet.firstName} {vet.lastName}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <Mail size={12} />
                      {vet.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  {formatPhoneDisplay(vet.phone)}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <button
                    disabled={!canManageUsers}
                    onClick={() => {
                      setSelectedUser(vet);
                      setShowEditModal(true);
                    }}
                    className="p-2 text-gray-500 hover:text-[#5EE6FE] dark:text-gray-400 dark:hover:text-[#5EE6FE] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    disabled={!canManageUsers}
                    onClick={() => {
                      setSelectedUser(vet);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!loading && filteredVeterinarians.length === 0 && (
            <tr>
              <td colSpan="3" className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No veterinarians found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex bg-[#FBFBFB] dark:bg-[#101010] min-h-screen">
      <AlertComponent />
      <main className="flex-1 p-4 flex flex-col">
        <Header title="User Management" />
        
        <div className="bg-white dark:bg-[#181818] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                />
              </div>
            </div>
            
            <button
              onClick={() => {
                setAddErrors({});
                setShowAddModal(true);
              }}
              disabled={!canManageUsers || loading || submitting}
              className="flex items-center gap-2 px-4 py-2 bg-[#5EE6FE] text-white rounded-lg hover:bg-[#4CD5ED] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus size={16} />
              Add {activeTab === 'admins' ? 'Admin' : 'Veterinarian'}
            </button>
          </div>
          {!canManageUsers && (
            <p className="text-xs text-amber-600 dark:text-amber-400">Read-only mode: only admin accounts can add, edit, or delete users.</p>
          )}
        </div>

        {/* tabs */}
        <div className="bg-white dark:bg-[#181818] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab("admins")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                activeTab === "admins"
                  ? "bg-[#5EE6FE] text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Shield size={18} />
              <span className="font-medium">Administrators ({admins.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("veterinarians")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                activeTab === "veterinarians"
                  ? "bg-[#5EE6FE] text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <BriefcaseMedical size={18} />
              <span className="font-medium">Veterinarians ({veterinarians.length})</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#181818] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex-1">
          {loading ? (
            <div className="py-10 text-center text-gray-600 dark:text-gray-300">Loading users...</div>
          ) : (
            activeTab === "admins" ? renderAdminsTable() : renderVeterinariansTable()
          )}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    Add New User
                  </h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setNewUser({...newUser, type: 'admin'})}
                      className={`px-4 py-3 rounded-lg border ${
                        newUser.type === 'admin'
                          ? 'border-[#5EE6FE] bg-[#5EE6FE]/10 text-[#5EE6FE]'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <Shield size={18} />
                        <span className="font-medium">Admin</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setNewUser({...newUser, type: 'veterinarian'})}
                      className={`px-4 py-3 rounded-lg border ${
                        newUser.type === 'veterinarian'
                          ? 'border-[#5EE6FE] bg-[#5EE6FE]/10 text-[#5EE6FE]'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <BriefcaseMedical size={18} />
                        <span className="font-medium">Veterinarian</span>
                      </div>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={newUser.firstName}
                        onChange={(e) => {
                          setNewUser({...newUser, firstName: e.target.value.replace(/[^\p{L}\p{M} '\-.]/gu, '')});
                          setAddErrors((prev) => ({ ...prev, firstName: '' }));
                        }}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                        placeholder="First name"
                      />
                      {addErrors.firstName && <p className="mt-1 text-xs text-red-500">{addErrors.firstName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={newUser.lastName}
                        onChange={(e) => {
                          setNewUser({...newUser, lastName: e.target.value.replace(/[^\p{L}\p{M} '\-.]/gu, '')});
                          setAddErrors((prev) => ({ ...prev, lastName: '' }));
                        }}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                        placeholder="Last name"
                      />
                      {addErrors.lastName && <p className="mt-1 text-xs text-red-500">{addErrors.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => {
                        setNewUser({...newUser, email: e.target.value});
                        setAddErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                      placeholder="Enter email address"
                    />
                    {addErrors.email && <p className="mt-1 text-xs text-red-500">{addErrors.email}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      A random password will be sent to this email
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                      <span className="px-3 text-gray-500 dark:text-gray-400">+63</span>
                      <input
                        type="tel"
                        value={normalizePhoneInput(newUser.phone)}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onChange={(e) => {
                          setNewUser({...newUser, phone: normalizePhoneInput(e.target.value)});
                          setAddErrors((prev) => ({ ...prev, phone: '' }));
                        }}
                        className="w-full px-3 py-2 rounded-r-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                        placeholder="9XXXXXXXXX"
                        maxLength={10}
                      />
                    </div>
                    {addErrors.phone && <p className="mt-1 text-xs text-red-500">{addErrors.phone}</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUser}
                    disabled={submitting || !newUser.firstName || !newUser.lastName || !newUser.email}
                    className="px-4 py-2 bg-[#5EE6FE] text-white rounded-lg hover:bg-[#4CD5ED] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : 'Add User & Send Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    Edit User
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                      setEditErrors({});
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={selectedUser.firstName}
                        onChange={(e) => {
                          setSelectedUser({...selectedUser, firstName: e.target.value.replace(/[^\p{L}\p{M} '\-.]/gu, '')});
                          setEditErrors((prev) => ({ ...prev, firstName: '' }));
                        }}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                      />
                      {editErrors.firstName && <p className="mt-1 text-xs text-red-500">{editErrors.firstName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={selectedUser.lastName}
                        onChange={(e) => {
                          setSelectedUser({...selectedUser, lastName: e.target.value.replace(/[^\p{L}\p{M} '\-.]/gu, '')});
                          setEditErrors((prev) => ({ ...prev, lastName: '' }));
                        }}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                      />
                      {editErrors.lastName && <p className="mt-1 text-xs text-red-500">{editErrors.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={selectedUser.email}
                      onChange={(e) => {
                        setSelectedUser({...selectedUser, email: e.target.value});
                        setEditErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                    />
                    {editErrors.email && <p className="mt-1 text-xs text-red-500">{editErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                      <span className="px-3 text-gray-500 dark:text-gray-400">+63</span>
                      <input
                        type="tel"
                        value={normalizePhoneInput(selectedUser.phone || '')}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onChange={(e) => {
                          setSelectedUser({...selectedUser, phone: normalizePhoneInput(e.target.value)});
                          setEditErrors((prev) => ({ ...prev, phone: '' }));
                        }}
                        className="w-full px-3 py-2 rounded-r-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                        maxLength={10}
                        placeholder="9XXXXXXXXX"
                      />
                    </div>
                    {editErrors.phone && <p className="mt-1 text-xs text-red-500">{editErrors.phone}</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                      setEditErrors({});
                    }}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditUser}
                    disabled={submitting}
                    className="px-4 py-2 bg-[#5EE6FE] text-white rounded-lg hover:bg-[#4CD5ED]"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <Trash2 className="text-red-500 dark:text-red-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      Delete Account
                    </h3>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  You are about to delete <span className="font-semibold">{selectedUser.firstName} {selectedUser.lastName}</span>'s account.
                  This action removes access immediately and should only be used for deactivated staff records.
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={submitting}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    {submitting ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminSettings;