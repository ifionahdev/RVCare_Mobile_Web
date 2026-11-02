import Sidebar from "./template/Sidebar";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div className="flex bg-[#FBFBFB] dark:bg-[#101010] h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-2 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
