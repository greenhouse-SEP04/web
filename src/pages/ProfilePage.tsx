import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getDevices } from "@/services/mockApi";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const { user } = useAuth();
  const [deviceCount, setDeviceCount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      getDevices(user.role === "admin" ? undefined : user.id).then((devices) => {
        setDeviceCount(devices.length);
      });
    }
  }, [user]);

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Profile</h1>

      {user && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Username:</span>
            <span className="text-gray-800 font-semibold">{user.username}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Number of Devices:</span>
            <span className="text-gray-800 font-semibold">{deviceCount}</span>
          </div>

          <Link
            to="/reset"
            className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Change Password
          </Link>
        </div>
      )}
    </div>
  );
}