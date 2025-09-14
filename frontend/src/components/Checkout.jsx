import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import { axiosInstance } from "../lib/axiosInstance.js";
import toast from "react-hot-toast";
import { Shield, Truck } from "lucide-react";
import SvgLoader from "./SvgLoader.jsx";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const ChangeView = ({ center, zoom = 13 }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const LocationMarker = ({ location, onLocationSelect, setLocationPinned }) => {
  const [position, setPosition] = useState(location);

  useEffect(() => {
    setPosition(location);
  }, [location]);

  useMapEvents({
    click(e) {
      const latlng = e.latlng;
      setPosition(latlng);
      onLocationSelect(latlng);
      setLocationPinned(true);
    },
  });

  return position ? <Marker position={position} icon={markerIcon} /> : null;
};

const Checkout = () => {
  const navigate = useNavigate();
  const reactLocation = useLocation();
  const [userLocation, setUserLocation] = useState(null);
  const [locationPinned, setLocationPinned] = useState(false);

  const buyNow = reactLocation?.state?.buyNow || false;
  const fromAuth = reactLocation?.state?.fromAuth || false;
  const [buynow, setBuynow] = useState([]);
  const { authUser } = useAuthStore();
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [formData, setFormData] = useState({
    firstName: authUser?.fullName.split(" ")[0] || "",
    lastName: authUser?.fullName.split(" ")[1] || "",
    email: authUser?.email || "",
    phone: authUser?.phoneNumber || "",
    address: authUser?.shippingAddress?.address || "",
    city: "Kathmandu",
    landmark: authUser?.shippingAddress?.landmark || "",
    shortnote: "",
  });
  const [errors, setErrors] = useState({});
  const [isOrdering, setIsOrdering] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const grandTotal = totalAmount;
  const [locationData, setLocationData] = useState({});
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [municipalityList, setMunicipalityList] = useState([]);
  const [step, setStep] = useState(1);

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
        setMunicipalityList(districtData);
        console.log("Municipalities (array):", districtData);
      } else if (typeof districtData === "object") {
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

  // const deliveryCharge = 150.0;

  useEffect(() => {
    try {
      if (fromAuth) {
        const stored = sessionStorage.getItem("formData");
        const formData = stored ? JSON.parse(stored) : {};
        setFormData(formData);
        if (formData.shippingAddress) {
          setSelectedProvince(formData.shippingAddress.province || "");
          setSelectedDistrict(formData.shippingAddress.district || "");
          setSelectedMunicipality(formData.shippingAddress.municipality || "");
          setUserLocation(
            formData.shippingAddress.location || { lat: 0, lng: 0 }
          );
        }
      }
    } catch (err) {
      console.error("Invalid formData in sessionStorage", err);
    }
  }, [fromAuth]);

  const fetchCart = async () => {
    if (buyNow) {
      const buyNowData = sessionStorage.getItem("buyNow");
      const buyNowItem = buyNowData ? JSON.parse(buyNowData) : null;
      if (buyNowItem && Object.keys(buyNowItem).length > 0) {
        setBuynow([buyNowItem]);
        calculateTotal(buyNowItem, "buyNow");
      }
    } else {
      if (authUser) {
        try {
          const response = await axiosInstance.get(`/cart/${authUser._id}`);
          setCartItems(response.data.products);
          calculateTotal(response.data.products, "cart");
        } catch (error) {
          console.error("Error loading cart:", error);
          setCartItems([]);
        }
      } else {
        try {
          const cartData = localStorage.getItem("cart");
          const savedCartItems = cartData ? JSON.parse(cartData) : [];

          // const buyNowData = sessionStorage.getItem("buyNow");
          // const buyNowItem = buyNowData ? JSON.parse(buyNowData) : null;

          const itemsArray = savedCartItems.filter((item) => item !== null);
          setCartItems(itemsArray);
          calculateTotal(itemsArray, "cart");

          // if (buyNowItem && Object.keys(buyNowItem).length > 0) {
          //   setBuynow([buyNowItem]);
          //   calculateTotal(buyNowItem, "buyNow");
          // }
        } catch (error) {
          console.error("Error loading cart data:", error);
          setCartItems([]);
          setBuynow([]);
          localStorage.removeItem("cart");
          sessionStorage.removeItem("buyNow");
        }
      }
    }
  };
  const fetchUserInfo = async () => {
    if (authUser) {
      try {
        const response = await axiosInstance.get(`/userinfo/${authUser._id}`);
        setFormData({
          firstName: response.data.fullName.split(" ")[0],
          lastName: response.data.fullName.split(" ")[1],
          email: response.data.email,
          phone: response.data.phoneNumber || "",
          address: response.data.shippingAddress?.address || "",
          city: "Kathmandu",
          landmark: response.data.shippingAddress?.landmark || "",
          shortnote: "",
        });
        setSelectedProvince(response.data.shippingAddress?.province || "");
        setSelectedDistrict(response.data.shippingAddress?.district || "");
        setSelectedMunicipality(
          response.data.shippingAddress?.municipality || ""
        );
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    }
  };
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation not available or denied", error);
          // fallback to Kathmandu
          setUserLocation({ lat: 27.7172, lng: 85.324 });
        }
      );
    } else {
      setUserLocation({ lat: 0, lng: 0 }); // fallback
    }
  }, []);
  const handleLocateMe = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported in this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(ll);
        setLocationPinned(true); // ✅ mark location as chosen
        setShowMap(true); // ✅ always open the map when this is triggered
      },
      (err) => {
        console.error(err);
        toast.error("Couldn't get your location. Please allow permission.");
      }
    );
  };

  useEffect(() => {
    fetchCart();
    fetchUserInfo();
  }, [authUser]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup function that runs when component unmounts
      sessionStorage.removeItem("buyNow");
    };
  }, []);

  const calculateTotal = (items, status) => {
    if (status === "buyNow") {
      return setTotalAmount(items.price * items.quantity);
    }
    const subtotal = items.reduce((sum, item) => {
      // const price = parseFloat(item.currentPrice.replace(/[^\d.-]/g, "")) || 0;
      const price = item.price;
      return sum + price * item.quantity;
    }, 0);
    setTotalAmount(subtotal);
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Invalid phone number (10 digits)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const handleAuth = (e) => {
    validateForm();
    if (!authUser) {
      navigate("/auth", {
        state: {
          fromCheckout: reactLocation.pathname === "/checkout", // Compute directly
        },
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Clciked");
    try {
      const shippingAddress = {
        address: formData.address,
        city: formData.city,
        landmark: formData.landmark,
        province: selectedProvince,
        district: selectedDistrict,
        municipality: selectedMunicipality,
        location: locationPinned ? userLocation : null, // ✅ only include if pinned
      };

      if (validateForm()) {
        if (!authUser) {
          sessionStorage.setItem(
            "formData",
            JSON.stringify({ ...formData, shippingAddress: shippingAddress })
          );
          navigate("/auth", {
            state: {
              fromCheckout: location.pathname === "/checkout", // Compute directly
            },
          });
        } else {
          if (
            !authUser?.shippingAddress?.province ||
            !authUser?.shippingAddress?.district ||
            !authUser?.shippingAddress?.municipality
          ) {
            const shipResponse = await axiosInstance.post(
              `/shippingaddress/${authUser._id}`,
              shippingAddress
            );
          }
          setIsOrdering(true);

          const response = await axiosInstance.post("/checkout", {
            userId: authUser._id,
            username: authUser.fullName,
            mail: authUser.email,
            phoneNumber: authUser.phoneNumber || formData.phone,
            products: buynow.length > 0 ? buynow : cartItems,
            shippingAddress: {
              street: formData.address,
              city: formData.city,
              landMark: formData.landmark,
              location: locationPinned ? userLocation : null, // ✅ conditional
              shortnote: formData.shortnote,
              province: selectedProvince,
              district: selectedDistrict,
              municipality: selectedMunicipality,
            },
          });

          // toast.success(response.data.message);

          if (!response) {
            toast.error("Couldn't checkout");
          }

          setIsOrdering(false);
          localStorage.setItem("cart", JSON.stringify([]));
          navigate("/");
          setBuynow([]);
          sessionStorage.removeItem("buyNow");
          toast.success("Your order has been placed.");
          const data = {
            to: authUser.email,
            subject: "Thank you for your order!",
            text: "Thanks",
            name: authUser.fullName,
            total: totalAmount,
            createdAt: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            shippingAddress: {
              street: formData.address,
              city: formData.city,
              landMark: formData.landmark,
            },
          };

          axiosInstance
            .post("/sendMail", data)
            .then(() => {
              console.log("Mail sent successfully");
            })
            .catch((err) => {
              console.log(err);
            });
        }
      }
    } catch (error) {
      console.log("Error while checking out: ", error);
      toast.error("Failed to checkout");
      setIsOrdering(false);
    } finally {
      setIsOrdering(false);
    }
  };

  const handlePayment = () => {
    alert("Payment feature will be available soon.");
  };

  if (cartItems.length === 0 && !buyNow) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-700">
          Your Cart is Empty
        </h1>
        <Link
          to="/"
          className="mt-4 inline-block bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left side - Form */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Shipping Information
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.firstName
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-blue-200"
                    }`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={
                      formData.lastName ||
                      authUser?.fullName.split(" ")[1] ||
                      ""
                    }
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.lastName
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-blue-200"
                    }`}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || authUser?.email || ""}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.email
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone || authUser?.phoneNumber || ""}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.phone
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
              </div>

              {/* <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.address
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value="Only Kathmandu"
                    // onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.city
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-blue-200"
                    }`}
                    readOnly
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-500">{errors.city}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="landmark"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Landmark <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="landmark"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleInputChange}
                    placeholder="eg. School, hospital, bank, etc."
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.landmark
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-blue-200"
                    }`}
                  />
                  {errors.landmark && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.landmark}
                    </p>
                  )}
                </div>
              </div> */}
              <div className="w-full  mx-auto border rounded shadow bg-white">
                {/* Breadcrumb Navigation */}
                <div className="flex border-b text-sm text-blue-600 font-medium">
                  <div
                    onClick={() => setStep(1)}
                    className={`cursor-pointer px-3 py-2 ${
                      step === 1 ? "border-b-2 border-blue-600" : ""
                    }`}
                  >
                    {selectedProvince || "Select Province"}
                  </div>
                  {selectedProvince && (
                    <div
                      onClick={() => setStep(2)}
                      className={`cursor-pointer px-3 py-2 ${
                        step === 2 ? "border-b-2 border-blue-600" : ""
                      }`}
                    >
                      {selectedDistrict || "Select District"}
                    </div>
                  )}
                  {selectedDistrict && (
                    <div
                      onClick={() => setStep(3)}
                      className={`cursor-pointer px-3 py-2 ${
                        step === 3 ? "border-b-2 border-blue-600" : ""
                      }`}
                    >
                      {selectedMunicipality || "Select Address"}
                    </div>
                  )}
                </div>

                {/* Step 1: Province */}
                {step === 1 && (
                  <div className="p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province
                    </label>
                    <select
                      value={selectedProvince}
                      onChange={(e) => {
                        setSelectedProvince(e.target.value);
                        setSelectedDistrict("");
                        setSelectedMunicipality("");
                        setStep(2);
                      }}
                      className="w-full px-4 py-2 border rounded-md"
                    >
                      <option value="">Select Province</option>
                      {provinces.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Step 2: District */}
                {step === 2 && selectedProvince && (
                  <div className="p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => {
                        setSelectedDistrict(e.target.value);
                        setSelectedMunicipality("");
                        setStep(3);
                      }}
                      className="w-full px-4 py-2 border rounded-md"
                    >
                      <option value="">Select District</option>
                      {districts.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Step 3: Municipality */}
                {step === 3 && selectedDistrict && (
                  <div className="p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <select
                      value={selectedMunicipality}
                      onChange={(e) => setSelectedMunicipality(e.target.value)}
                      className="w-full px-4 py-2 border rounded-md"
                    >
                      <option value="">Select Address</option>
                      {municipalityList.map((mun) => (
                        <option key={mun} value={mun}>
                          {mun}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Final Display */}
                {selectedProvince &&
                  selectedDistrict &&
                  selectedMunicipality && (
                    <div className="p-3 border-t bg-gray-50 text-sm text-gray-700">
                      📍{" "}
                      <strong>
                        {selectedProvince}, {selectedDistrict},{" "}
                        {selectedMunicipality}
                      </strong>
                    </div>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pin Your Delivery Location (Optional)
                </label>

                <button
                  type="button"
                  onClick={handleLocateMe}
                  className="mb-2 inline-flex items-center px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
                >
                  Use my current location
                </button>
                {showMap && userLocation && (
                  <>
                    <div className="relative w-full h-64 rounded-md overflow-hidden border border-gray-300">
                      <button
                        type="button"
                        onClick={() => setShowMap(false)}
                        className="absolute top-2 right-2 z-[1000] bg-red-400 border cursor-pointer border-gray-300 rounded-full w-8 h-8 flex items-center justify-center text-white hover:bg-red-300"
                        aria-label="Close Map"
                      >
                        &times;
                      </button>

                      <MapContainer
                        center={[userLocation.lat, userLocation.lng]}
                        zoom={13}
                        scrollWheelZoom={false}
                        className="w-full h-full"
                      >
                        <ChangeView
                          center={[userLocation.lat, userLocation.lng]}
                        />
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationMarker
                          location={userLocation}
                          onLocationSelect={(latlng) => setUserLocation(latlng)}
                          setLocationPinned={setLocationPinned}
                        />
                      </MapContainer>
                    </div>

                    {/* ✅ Place this outside the .h-64 container */}
                    <p className="text-sm text-black mt-2">
                      Selected Location: Latitude {userLocation.lat.toFixed(5)},
                      Longitude {userLocation.lng.toFixed(5)}
                    </p>
                  </>
                )}
              </div>

              <div>
                <label
                  htmlFor="shortnote"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Leave your note
                </label>
                <input
                  type="text"
                  id="shortnote"
                  name="shortnote"
                  value={formData.shortnote}
                  onChange={handleInputChange}
                  placeholder="eg. Deliver my order at 4PM, I won't be availabe at office time, etc."
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-200`}
                />
              </div>
            </form>
          </div>
        </div>

        {/* Right side - Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Order Summary
            </h2>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {buyNow
                ? buynow.map((item) => (
                    <div
                      key={item.id || item._id}
                      className="flex justify-between items-center border-b pb-4 gap-3"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-contain rounded-md border border-gray-200"
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-800 text-justify line-clamp-2">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">
                          $ {(item.price * item.quantity).toFixed(2)}
                          {/* {(
                          parseFloat(item.currentPrice.replace(/[^\d.-]/g, "")) *
                          item.quantity
                        ).toFixed(2)} */}
                        </p>
                      </div>
                    </div>
                  ))
                : cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center border-b pb-4 gap-3"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain rounded-md border border-gray-200"
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-800 text-justify line-clamp-2">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">
                          $ {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${totalAmount.toFixed(2)}</span>
              </div>

              {/* <div className="flex justify-between">
                <span className="text-gray-600">Delivery</span>
                <span className="font-medium">
                  ${deliveryCharge.toFixed(2)}
                </span>
              </div> */}
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-semibold">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
              <h2 className="text-lg font-semibold">We guarantee</h2>
              <div className="flex gap-3">
                <Shield />
                <span className="text-pink-500">
                  <em>14 days free return</em>
                </span>
              </div>
              <div className="flex gap-3">
                <Truck />
                <span className="text-pink-500">
                  <em>Free Delivery</em>
                </span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              type="button"
              className="w-full mt-6 bg-black hover:bg-gray-800 text-white py-3 px-4 rounded-md font-medium transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer"
            >
              Proceed to Payment
            </button>

            {/* <Link
              to="/"
              className="mt-4 inline-block text-center w-full text-black border border-black px-4 py-2 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
            </Link> */}
            <button
              onClick={handleSubmit}
              className="mt-4 flex justify-center text-center w-full text-black border border-black px-4 py-2 rounded-md hover:bg-gray-50 transition-colors duration-200 gap-3 cursor-pointer"
              disabled={isOrdering}
            >
              {isOrdering ? (
                <div className="flex gap-3">
                  <SvgLoader forCheckout={true} />
                  Loading...
                </div>
              ) : (
                "Confirm Order"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
