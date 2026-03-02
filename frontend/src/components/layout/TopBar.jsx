import React from "react";
import { useAuth } from "../../contexts/AuthContext";

const TopBar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="h-14 px-4 border-b bg-white flex items-center justify-between">
      <div className="font-semibold">Hospital Diet System</div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{user?.role || "Guest"}</span>
        {user && (
          <button
            onClick={logout}
            className="px-3 py-1 rounded-md border text-sm hover:bg-gray-100"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

export default TopBar;