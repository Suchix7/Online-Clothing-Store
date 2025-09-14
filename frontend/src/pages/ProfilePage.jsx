import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiLock,
  FiEdit,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import {
  FaBox,
  FaBoxOpen,
  FaBoxTissue,
  FaFirstOrder,
  FaJediOrder,
} from "react-icons/fa";
import {
  Box,
  LogOut,
  Boxes,
  BoxesIcon,
  BoxIcon,
  BoxSelect,
  LucideListOrdered,
  Loader,
} from "lucide-react";
import Order from "../components/Order";
import { useAuthStore } from "../store/useAuthStore.js";
import { axiosInstance } from "../lib/axiosInstance.js";
import toast from "react-hot-toast";
import TopBar from "../components/TopBar.jsx";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { checkAuth, authUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [locationData, setLocationData] = useState({});
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");

  const [municipalityList, setMunicipalityList] = useState([]);
  // Mock user data - this will later come from backend
  const [user, setUser] = useState({});
  useEffect(() => {
    axiosInstance
      .get("location?lang=english")
      .then((res) => {
        setLocationData(res.data || {});
      })
      .catch((err) => {
        console.error("Failed to load location data", err);
      });
  }, []);
  const provinces = Object.keys(locationData);
  const districts =
    selectedProvince && locationData[selectedProvince]
      ? Object.keys(locationData[selectedProvince])
      : [];
  useEffect(() => {
    if (
      selectedProvince &&
      selectedDistrict &&
      locationData[selectedProvince] &&
      locationData[selectedProvince][selectedDistrict]
    ) {
      const districtData = locationData[selectedProvince][selectedDistrict];

      if (Array.isArray(districtData)) {
        // Direct array of municipalities
        setMunicipalityList(districtData);
        console.log("Municipalities (array):", districtData);
      } else if (typeof districtData === "object") {
        // Object with types like "Na.Pa.", "Ma.Na.Pa." etc
        const allMunicipalities = Object.values(districtData).flat();
        setMunicipalityList(allMunicipalities);
        console.log("Municipalities (nested object):", allMunicipalities);
      } else {
        console.warn("Unexpected districtData format:", districtData);
        setMunicipalityList([]);
      }
    } else {
      setMunicipalityList([]);
    }
  }, [selectedProvince, selectedDistrict, locationData]);

  useEffect(() => {
    if (authUser === null) {
      return;
    }
    console.log(authUser);
    setUser({
      id: authUser?._id,
      fullName: authUser?.fullName,
      email: authUser?.email,
      phoneNumber: authUser?.phoneNumber,
      address: authUser?.shippingAddress?.address,
      city: authUser?.shippingAddress?.city,
      landmark: authUser?.shippingAddress?.landmark,
    });

    setSelectedProvince(authUser?.shippingAddress?.province || "");
    setSelectedDistrict(authUser?.shippingAddress?.district || "");
    setSelectedMunicipality(authUser?.shippingAddress?.municipality || "");
  }, [authUser]);

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    setIsEditing(false);
    setLoading(true);
    // Here you would typically send the updated data to your backend
    try {
      console.log(user);
      const response = await axiosInstance.post("/auth/update-user", {
        id: user.id,
        userData: {
          ...user,
          shippingAddress: {
            address: user.address,
            city: user.city,
            landmark: user.landmark,
            province: selectedProvince,
            district: selectedDistrict,
            municipality: selectedMunicipality,
          },
        },
      });

      toast.success(response.data.message);
      setLoading(false);
    } catch (error) {
      toast.error("Couldn't update your info");
      console.log("Error while updating profile info: ", error);
    } finally {
      setLoading(false);
      setIsEditing(false);
    }
  };

  const handleChangePassword = async () => {
    // Validate passwords match
    setLoading(true);
    const data = {
      id: user.id,
      newPassword: passwordForm.confirmPassword,
      currentPassword: passwordForm.currentPassword,
    };

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords don't match!");
      setLoading(false);
      return;
    }

    // Here you would send the password change request to backend
    console.log("Password change request:", {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });

    // Reset form
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    try {
      const response = await axiosInstance.post("/auth/change-password", data);

      toast.success(response.data.message);
      setLoading(false);
    } catch (error) {
      toast.error("Incorrect current password");
      console.log("Error while updating password", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <TopBar />
      <Navbar />

      {/* Main Content */}
      <main className="max-w-[1620px] mx-auto py-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row gap-8"
        >
          {/* Profile Sidebar */}
          <div className="w-full md:w-1/3 lg:w-1/4">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-8">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                  <FiUser className="w-12 h-12 text-gray-600" />
                </div>
                <h2 className="text-xl font-bold text-center">
                  {user.fullName}
                </h2>
                <p className="text-gray-600 text-sm">{user.email}</p>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left ${
                    activeTab === "profile"
                      ? "bg-gray-100 font-medium"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <FiUser className="w-5 h-5" />
                  <span>Profile</span>
                </button>
                {!authUser?.isGoogle && (
                  <button
                    onClick={() => setActiveTab("password")}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left ${
                      activeTab === "password"
                        ? "bg-gray-100 font-medium"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <FiLock className="w-5 h-5" />
                    <span>Change Password</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left ${
                    activeTab === "orders"
                      ? "bg-gray-100 font-medium"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <Box className="w-5 h-5" />
                  <span>Orders</span>
                  {/* <Order /> */}
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-gray-50`}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Profile Content */}
          <div className="w-full md:w-2/3 lg:w-3/4">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTab === "profile" && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="p-8"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
                      <h3 className="text-xl sm:text-2xl font-bold leading-tight">
                        Personal Information
                      </h3>

                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 border border-black rounded-lg hover:bg-gray-50 text-sm sm:text-base w-full sm:w-auto"
                          aria-label="Edit Profile"
                        >
                          <FiEdit className="w-5 h-5 shrink-0" />
                          <span className="hidden sm:inline">Edit Profile</span>
                        </button>
                      ) : (
                        <div className="flex flex-col xs:flex-row sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                          <button
                            onClick={() => setIsEditing(false)}
                            className="px-3 py-2 sm:px-4 sm:py-2 border border-black rounded-lg hover:bg-gray-50 text-sm sm:text-base w-full sm:w-auto"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveProfile}
                            className="px-3 py-2 sm:px-4 sm:py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm sm:text-base w-full sm:w-auto"
                          >
                            Save Changes
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Full Name
                            </label>
                            <input
                              type="text"
                              name="fullName"
                              value={user.fullName}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              name="phoneNumber"
                              value={user.phoneNumber}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={user.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            // Email often can't be changed or requires verification
                          />
                        </div>
                        <div>
                          <h3 className="text-2xl font-semibold mt-6 mb-8">
                            Shipping Address
                          </h3>
                          <div className="w-full mx-auto  rounded shadow bg-white">
                            {/* Header (optional) */}
                            <div className=" px-4 py-2 text-sm text-gray-700">
                              Your location
                            </div>

                            {/* 3 independent dropdowns */}
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                              {/* Province */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Province
                                </label>
                                <select
                                  value={selectedProvince}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setSelectedProvince(v);
                                    setSelectedDistrict("");
                                    setSelectedMunicipality("");
                                    // If you derive `districts` from province, keep your existing effect/helper.
                                  }}
                                  className="w-full px-4 py-2  rounded-md"
                                >
                                  <option value="">Select Province</option>
                                  {provinces.map((prov) => (
                                    <option key={prov} value={prov}>
                                      {prov}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* District */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  District
                                </label>
                                <select
                                  value={selectedDistrict}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setSelectedDistrict(v);
                                    setSelectedMunicipality("");
                                    // If you derive `municipalityList` from district, keep your existing effect/helper.
                                  }}
                                  className="w-full px-4 py-2   disabled:bg-gray-100"
                                  disabled={!selectedProvince}
                                >
                                  <option value="">
                                    {selectedProvince
                                      ? "Select District"
                                      : "Select Province first"}
                                  </option>
                                  {selectedProvince &&
                                    districts.map((dist) => (
                                      <option key={dist} value={dist}>
                                        {dist}
                                      </option>
                                    ))}
                                </select>
                              </div>

                              {/* Address / Municipality */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Address
                                </label>
                                <select
                                  value={selectedMunicipality}
                                  onChange={(e) =>
                                    setSelectedMunicipality(e.target.value)
                                  }
                                  className="w-full px-4 py-2  disabled:bg-gray-100"
                                  disabled={!selectedDistrict}
                                >
                                  <option value="">
                                    {selectedDistrict
                                      ? "Select Address"
                                      : "Select District first"}
                                  </option>
                                  {selectedDistrict &&
                                    municipalityList.map((mun) => (
                                      <option key={mun} value={mun}>
                                        {mun}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">
                              Full Name
                            </h4>
                            <p className="text-lg">{user.fullName}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">
                              Phone Number
                            </h4>
                            <p className="text-lg">{user.phoneNumber}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">
                            Email Address
                          </h4>
                          <p className="text-lg">{user.email}</p>
                        </div>
                        <div>
                          <h3 className="text-2xl font-semibold mb-8 mt-6">
                            Shipping Address
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">
                                Province
                              </h4>
                              <p className="text-lg">
                                {selectedProvince || "Not added yet"}
                              </p>
                            </div>{" "}
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">
                                District
                              </h4>
                              <p className="text-lg">
                                {selectedDistrict || "Not added yet"}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">
                                Address
                              </h4>
                              <p className="text-lg">
                                {selectedMunicipality || "Not added yet"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "password" && (
                  <motion.div
                    key="password"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="p-8"
                  >
                    <h3 className="text-2xl font-bold mb-8">Change Password</h3>

                    <div className="space-y-6 max-w-lg mx-auto">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                      <div className="flex space-x-3 justify-end">
                        <button
                          onClick={() => {
                            setIsChangingPassword(false);
                            setPasswordForm({
                              currentPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                            });
                          }}
                          className="px-4 py-2 border border-black rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleChangePassword}
                          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex"
                        >
                          {loading ? (
                            <>
                              <Loader className="animate-spin" />
                              Update Password
                            </>
                          ) : (
                            <>Update Password</>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
                {activeTab === "orders" && (
                  <motion.div
                    key="orders"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="p-8"
                  >
                    {/* <h3 className="text-2xl font-bold mb-8">Your Orders</h3> */}
                    {/* Order history will be displayed here */}
                    <Order profilePage={true} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ProfilePage;
