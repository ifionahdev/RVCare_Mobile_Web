import { useState, useEffect, useRef } from "react"; 
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Users, Calendar, ClipboardList, FileBarChart, Settings, LogOut, Edit, MoreVertical, Lock, Eye, EyeOff, Check, Circle, ScrollText } from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/authContext.jsx";

const Sidebar = () => {
  const location = useLocation(); 
  const navigate = useNavigate(); 
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userName, setUserName] = useState("Admin");
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordMessage, setChangePasswordMessage] = useState({ message: "", type: "" });
  const userMenuRef = useRef(null);

  const menuItems = [
    { name: "Dashboard", icon: <Home size={18} />, path: "/admin/dashboard" },
    { name: "Customer & Pet Management", icon: <Users size={18} />, path: "/admin/pet-management" },
    { name: "Appointments & Vet Schedules", icon: <Calendar size={18} />, path: "/admin/appointments" },
    { name: "Records Management", icon: <ClipboardList size={18} />, path: "/admin/records" },
    { name: "Content Management", icon: <Edit size={18} />, path: "/admin/content-manager" },
    { name: "Reports", icon: <FileBarChart size={18} />, path: "/admin/reports" },
    { name: "User Management", icon: <Settings size={18} />, path: "/admin/settings" },
    { name: "Audit Log", icon: <ScrollText size={18} />, path: "/admin/audit-log" },
  ];

  // Password validation
  const password = passwordData.newPassword;
  const confirm = passwordData.confirmPassword;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasLength = password.length >= 8;
  const hasSpecial = /[*\-@\$]/.test(password);
  const matches = password !== "" && password === confirm;
  const allValid = hasUpper && hasNumber && hasLength && hasSpecial && matches;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAdminName = async () => {
      try {
        const response = await api.get("/auth/me");
        const user = response.data.user;
        const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
        setUserName(name || "Admin");
      } catch (err) {
        console.error("❌ Failed to fetch admin name:", err);
        setUserName("Admin");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminName();
  }, []);

  const handleLogout = async () => {
    setShowLogoutModal(false);

    const token = localStorage.getItem("token");
    if (token) {
      try {
        await api.post(
          "/auth/logout",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("❌ Logout error:", err);
      }
    }

    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    localStorage.removeItem("petsCacheTimestamp");
    localStorage.removeItem("selectedPet");
    localStorage.removeItem("cachedPets");

    logout();
    navigate("/login", { replace: true });
  };

  const handleChangePassword = async () => {
    if (!allValid) {
      setChangePasswordMessage({ 
        message: "Please meet all password requirements before updating.", 
        type: "error" 
      });
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      setChangePasswordMessage({
        message: "User session not found. Please log in again.",
        type: "error"
      });
      return;
    }

    setChangePasswordLoading(true);
    setChangePasswordMessage({ message: "", type: "" });

    try {
      const payload = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      };

      const response = await api.put(`/users/${userId}/change-password`, payload);
      setChangePasswordMessage({
        message: response.data?.message || "Password changed successfully.",
        type: "success"
      });

      setTimeout(() => {
        setShowChangePasswordModal(false);
        resetPasswordForm();
      }, 1200);
      
    } catch (err) {
      console.error("Change password error:", err);
      setChangePasswordMessage({
        message: err?.response?.data?.message || "Failed to change password. Please check your current password.",
        type: "error"
      });
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const resetPasswordForm = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setShowPassword({
      current: false,
      new: false,
      confirm: false
    });
    setChangePasswordMessage({ message: "", type: "" });
  };

  const togglePassword = (key) => {
    setShowPassword(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordChange = (key, value) => {
    setPasswordData(prev => ({ ...prev, [key]: value }));
    if (changePasswordMessage.message) {
      setChangePasswordMessage({ message: "", type: "" });
    }
  };

  const itemClass = (condition) =>
    `flex items-start gap-2 ${condition ? "text-green-500" : "text-gray-400"}`;

  return (
    <aside className="w-64 h-screen bg-white shadow-[4px_0_12px_rgba(0,0,0,0.05)] flex flex-col justify-between py-6 rounded-r-2xl relative">
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <img src="/assets/raphacare-logo.png" alt="RaphaCare" className="w-24 mb-4 select-none" />
        <div className="font-baloo text-md sm:text-lg md:text-xl leading-none">
            <span className="text-[#000000]">RV</span>
            <span className="text-[#5EE6FE]">Care</span>
        </div>
      </div>

      {/* Navigation */}
      <ul className="space-y-1 px-4 flex-1">
        {menuItems.map((item, index) => (
          <li key={index}>
            <Link
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150
                ${location.pathname === item.path
                  ? "bg-[#F5FCFF] text-[#00BFFF]"
                  : "text-gray-600 hover:bg-[#F5FCFF] hover:text-[#00BFFF] dark:text-gray-300 dark:hover:bg-[#222]"
                }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* User Section */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#5EE6FE] to-[#4CD4EC] rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-xs">AD</span>
            </div>
            <div>
              <p className="text-gray-800 font-medium text-sm">
                {loading ? "Loading..." : userName}
              </p>
              <p className="text-gray-500 text-xs">Administrator</p>
            </div>
          </div>
          
          {/* Three-dot Menu Button */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
            >
              <MoreVertical size={18} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowChangePasswordModal(true);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Lock size={14} />
                  Change Password
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4">
        <div 
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center gap-3 px-4 py-2 rounded-xl text-gray-500 hover:bg-[#FFF4F4] hover:text-[#FF6B6B] cursor-pointer transition-all duration-150">
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePasswordModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
            }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-auto my-auto"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#5EE6FE] to-[#3ecbe0] rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Lock className="text-white" size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">
                    Change Password
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Secure your account
                  </p>
                </div>

                {/* Message Display */}
                {changePasswordMessage.message && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${
                    changePasswordMessage.type === "error" 
                      ? "bg-red-50 text-red-700 border border-red-200" 
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}>
                    {changePasswordMessage.message}
                  </div>
                )}

                <div className="space-y-3">
                  {[
                    { 
                      label: "Current Password", 
                      placeholder: "Enter current password", 
                      key: "currentPassword",
                      showKey: "current" 
                    },
                    { 
                      label: "New Password", 
                      placeholder: "Enter new password", 
                      key: "newPassword",
                      showKey: "new" 
                    },
                    { 
                      label: "Confirm New Password", 
                      placeholder: "Re-enter new password", 
                      key: "confirmPassword",
                      showKey: "confirm" 
                    },
                  ].map((item) => (
                    <div key={item.key}>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        {item.label}
                      </label>

                      <div className="relative">
                        <input
                          type={showPassword[item.showKey] ? "text" : "password"}
                          value={passwordData[item.key]}
                          onChange={(e) => handlePasswordChange(item.key, e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-1 focus:ring-[#5EE6FE] focus:border-[#5EE6FE] focus:outline-none transition-all duration-200 bg-gray-50/50"
                          placeholder={item.placeholder}
                        />

                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#5EE6FE] text-sm transition-colors duration-200"
                          onClick={() => togglePassword(item.showKey)}
                        >
                          {showPassword[item.showKey] ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>

                      {item.key === "newPassword" && (
                        <motion.div 
                          className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="text-sm font-medium text-gray-600 mb-2">Requirements:</p>
                          <div className="space-y-2 text-xs">
                            <div className={itemClass(hasUpper)}>
                              {hasUpper ? <Check size={10} className="mt-0.5" /> : <Circle size={10} className="mt-0.5" />}
                              <span>At least one uppercase letter</span>
                            </div>
                            <div className={itemClass(hasLength)}>
                              {hasLength ? <Check size={10} className="mt-0.5" /> : <Circle size={10} className="mt-0.5" />}
                              <span>At least 8 characters long</span>
                            </div>
                            <div className={itemClass(hasNumber)}>
                              {hasNumber ? <Check size={10} className="mt-0.5" /> : <Circle size={10} className="mt-0.5" />}
                              <span>At least one number (0-9)</span>
                            </div>
                            <div className={itemClass(hasSpecial)}>
                              {hasSpecial ? <Check size={10} className="mt-0.5" /> : <Circle size={10} className="mt-0.5" />}
                              <span>At least one special character (eg. @, #, $, *)</span>
                            </div>
                            <div className={itemClass(matches)}>
                              {matches ? <Check size={10} className="mt-0.5" /> : <Circle size={10} className="mt-0.5" />}
                              <span>Matches confirmation password</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-6">
                  <motion.button
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      resetPasswordForm();
                    }}
                    className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    disabled={changePasswordLoading || !allValid}
                    onClick={handleChangePassword}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      changePasswordLoading || !allValid
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#5EE6FE] to-[#3ecbe0] text-white hover:shadow-md"
                    }`}
                    whileHover={!changePasswordLoading && allValid ? { scale: 1.02 } : {}}
                    whileTap={!changePasswordLoading && allValid ? { scale: 0.98 } : {}}
                  >
                    {changePasswordLoading ? (
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </div>
                    ) : (
                      "Change Password"
                    )}
                  </motion.button>
                </div>
              </div>
              <div className="absolute inset-0 -z-10 opacity-[0.02] overflow-hidden rounded-xl">
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#5EE6FE] rounded-full blur-2xl"></div>
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-[#3ecbe0] rounded-full blur-2xl"></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 w-[320px] shadow-lg text-center animate-popUp">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Confirm Logout
            </h2>
            <p className="text-gray-600 text-sm mb-5">
              Are you sure you want to log out of your account?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-all duration-300"
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                className="bg-[#5EE6FE] text-white py-2 px-4 rounded-lg hover:bg-[#3ecbe0] transition-all duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;