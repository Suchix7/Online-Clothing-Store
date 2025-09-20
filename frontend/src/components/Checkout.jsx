import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import L from "leaflet";

/* --------------------------- Leaflet marker icon --------------------------- */
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

/* ------------------------------ Map helpers ------------------------------- */
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

/* ------------------------------ Pay Modal --------------------------------- */
/** IMPORTANT: defined OUTSIDE Checkout so it doesn't remount each render */
function PayModal({
  open,
  onClose,
  onPay,
  paying,
  onCardReady,
  onCardChange,
  canPay,
  cardOptions,
  setLiveCardRef, // callback to store the live CardElement instance in parent
}) {
  return (
    <div
      className={`fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center ${
        open ? "" : "hidden"
      }`}
    >
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Secure Payment</h3>
        <div className="p-3 border rounded-md">
          <CardElement
            options={cardOptions}
            onReady={(el) => {
              console.log("[CardElement] ready");
              onCardReady?.(true);
              setLiveCardRef?.(el);
            }}
            onChange={(e) => {
              console.log("[CardElement] change", e.complete);
              onCardChange?.(e.complete);
            }}
          />
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300"
            type="button"
            disabled={paying}
          >
            Cancel
          </button>
          <button
            onClick={onPay}
            className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
            disabled={paying || !canPay}
            type="button"
          >
            {paying ? "Processing..." : "Pay now"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Checkout -------------------------------- */
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

  // Stripe
  const stripe = useStripe();
  const elements = useElements();
  const cardOptions = useMemo(() => ({ hidePostalCode: false }), []);
  const liveCardElRef = useRef(null); // actual mounted CardElement instance

  // Helpers
  const toStr = (v) => (v == null ? "" : String(v));
  const safeSplit = (name = "") => {
    const parts = toStr(name).trim().split(/\s+/);
    const first = parts[0] || "";
    const last = parts.length > 1 ? parts.slice(1).join(" ") : "";
    return { first, last };
  };

  // Initial state
  const [formData, setFormData] = useState({
    firstName: safeSplit(authUser?.fullName).first,
    lastName: safeSplit(authUser?.fullName).last,
    email: toStr(authUser?.email),
    phone: toStr(authUser?.phoneNumber),
    address: toStr(authUser?.shippingAddress?.address),
    city: "Sydney",
    landmark: toStr(authUser?.shippingAddress?.landmark),
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

  const [showPay, setShowPay] = useState(false);
  const [paying, setPaying] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [cardReady, setCardReady] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [piInfo, setPiInfo] = useState({
    id: "", // paymentIntentId
    livemode: false,
    account: "",
  });

  /* --------------------------- Load location data -------------------------- */
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
      } else if (typeof districtData === "object") {
        const allMunicipalities = Object.values(districtData).flat();
        setMunicipalityList(allMunicipalities);
      } else {
        console.warn("Unexpected districtData format:", districtData);
        setMunicipalityList([]);
      }
    } else {
      setMunicipalityList([]);
    }
  }, [selectedProvince, selectedDistrict, locationData]);

  /* --------------------------- Restore from auth --------------------------- */
  useEffect(() => {
    try {
      if (fromAuth) {
        const stored = sessionStorage.getItem("formData");
        const form = stored ? JSON.parse(stored) : {};
        setFormData(form);
        if (form.shippingAddress) {
          setSelectedProvince(form.shippingAddress.province || "");
          setSelectedDistrict(form.shippingAddress.district || "");
          setSelectedMunicipality(form.shippingAddress.municipality || "");
          setUserLocation(form.shippingAddress.location || { lat: 0, lng: 0 });
        }
      }
    } catch (err) {
      console.error("Invalid formData in sessionStorage", err);
    }
  }, [fromAuth]);

  /* ------------------------------- Cart fetch ------------------------------ */
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
          const itemsArray = savedCartItems.filter((item) => item !== null);
          setCartItems(itemsArray);
          calculateTotal(itemsArray, "cart");
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
    if (!authUser) return;
    try {
      const { data } = await axiosInstance.get(`/userinfo/${authUser._id}`);
      const { first, last } = safeSplit(data.fullName);
      setFormData((f) => ({
        ...f,
        firstName: first,
        lastName: last,
        email: toStr(data.email),
        phone: toStr(data.phoneNumber),
        address: toStr(data.shippingAddress?.address),
        city: "Kathmandu",
        landmark: toStr(data.shippingAddress?.landmark),
        shortnote: "",
      }));
      setSelectedProvince(toStr(data.shippingAddress?.province));
      setSelectedDistrict(toStr(data.shippingAddress?.district));
      setSelectedMunicipality(toStr(data.shippingAddress?.municipality));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCart();
    fetchUserInfo();
  }, [authUser]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      sessionStorage.removeItem("buyNow");
    };
  }, []);

  /* ---------------------------- Geolocation pin ---------------------------- */
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
          setUserLocation({ lat: 27.7172, lng: 85.324 }); // fallback: Kathmandu
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
        setLocationPinned(true);
        setShowMap(true);
      },
      (err) => {
        console.error(err);
        toast.error("Couldn't get your location. Please allow permission.");
      }
    );
  };

  /* ----------------------------- Cart mapping ------------------------------ */
  const toServerItems = () => {
    const src = buyNow && buynow.length ? [buynow[0]] : cartItems || [];
    return src
      .filter(Boolean)
      .map((it) => {
        const productId =
          it?.productId?._id ||
          it?.product?._id ||
          it?.productId ||
          it?._id ||
          it?.id ||
          null;

        const qty = Number(it?.qty ?? it?.quantity ?? 1) || 1;

        const variantSku =
          it?.variantSku ?? it?.sku ?? it?.variant?.sku ?? undefined;

        return { productId, qty, variantSku };
      })
      .filter((x) => !!x.productId);
  };

  /* ------------------------------ Calculations ----------------------------- */
  const calculateTotal = (items, status) => {
    if (status === "buyNow") {
      return setTotalAmount(items.price * items.quantity);
    }
    const subtotal = items.reduce((sum, item) => {
      const price = item.price;
      return sum + price * item.quantity;
    }, 0);
    setTotalAmount(subtotal);
  };

  // inside Checkout.jsx
  // REPLACE your current handlePayNow with this version
  const handlePayNow = async () => {
    if (!stripe || !elements || !clientSecret) return;

    const card = liveCardElRef.current || elements.getElement(CardElement);
    if (!card) {
      toast.error("Payment form is still loading. Please wait a moment.");
      return;
    }

    try {
      setPaying(true);

      const { paymentIntent, error } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card,
            billing_details: {
              name: `${(formData.firstName || "").trim()} ${(
                formData.lastName || ""
              ).trim()}`.trim(),
              email: (formData.email || authUser?.email || "").trim(),
              phone: (formData.phone || authUser?.phoneNumber || "").trim(),
            },
          },
        }
      );

      if (error) {
        console.error("Stripe confirm error:", error);
        toast.error(error.message || "Payment failed");
        setPaying(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        try {
          // --- Build the SAME payload you used previously for /checkout ---
          const shippingAddress = {
            street: formData.address, // previously "street"
            city: formData.city, // "Kathmandu" or your chosen city
            landMark: formData.landmark, // previously "landMark"
            location: locationPinned ? userLocation : null,
            shortnote: formData.shortnote,
            province: selectedProvince,
            district: selectedDistrict,
            municipality: selectedMunicipality,
          };

          const products = buyNow && buynow.length > 0 ? buynow : cartItems;

          const checkoutBody = {
            userId: authUser?._id, // same as before
            username: authUser?.fullName, // same
            mail: authUser?.email, // same
            phoneNumber: authUser?.phoneNumber || formData.phone,
            products, // SAME product array you send now
            shippingAddress, // SAME shape as before
            // (Optional) You can include paymentIntentId for your own reconciliation
            paymentIntentId: paymentIntent.id,
          };

          // 1) Create order via the SAME route as before
          const response = await axiosInstance.post("/checkout", checkoutBody);
          if (!response) {
            toast.error("Couldn't checkout");
          }

          // 🔽 CLEAR SERVER CART FOR LOGGED-IN USERS
          try {
            if (authUser?._id) {
              await axiosInstance.delete(`/cart/remove/${authUser._id}`);
            }
          } catch (e) {
            console.warn("Failed to clear server cart (non-blocking):", e);
          }

          if (!response) {
            toast.error("Couldn't checkout");
            setPaying(false);
            setShowPay(false);
            return;
          }

          // 2) Clear cart storage EXACTLY like before
          try {
            // If you also clear server cart elsewhere, add it here if desired
            localStorage.setItem("cart", JSON.stringify([]));
          } catch (e) {
            console.warn("Cart clear (local) failed (non-blocking):", e);
          }

          // 3) Success UX + navigate home
          setShowPay(false);
          setPaying(false);
          setCartItems([]);
          setBuynow([]);
          localStorage.removeItem("cart");
          sessionStorage.removeItem("buyNow");
          toast.success("Your order has been placed.");
          navigate("/");

          // 4) Send the SAME email call as before
          try {
            const mailData = {
              to: authUser?.email || formData.email,
              subject: "Thank you for your order!",
              text: "Thanks",
              name:
                authUser?.fullName ||
                `${formData.firstName} ${formData.lastName}`.trim(),
              total: totalAmount, // number
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

            await axiosInstance.post("/sendMail", mailData);
          } catch (mailErr) {
            console.log("Email send failed (non-blocking):", mailErr);
          }

          return;
        } catch (orderErr) {
          console.error("Order creation failed after payment:", orderErr);
          setShowPay(false);
          setPaying(false);
          // Payment is captured; route home but inform user
          toast.error(
            "Payment captured, but we couldn't create the order. We'll contact you."
          );
          navigate("/");
          return;
        }
      }

      toast.error(`Payment status: ${paymentIntent?.status || "unknown"}`);
      setPaying(false);
    } catch (err) {
      console.error("Payment exception:", err);
      toast.error("Payment error");
      setPaying(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    const first = toStr(formData.firstName).trim();
    const last = toStr(formData.lastName).trim();
    const email = toStr(formData.email || authUser?.email).trim();
    const phoneDigits = toStr(formData.phone || authUser?.phoneNumber).replace(
      /\D/g,
      ""
    );

    if (!first) newErrors.firstName = "First name is required";
    if (!last) newErrors.lastName = "Last name is required";
    if (!email) newErrors.email = "Email is required";
    else if (!emailRegex.test(email)) newErrors.email = "Invalid email format";

    if (!phoneDigits) newErrors.phone = "Phone number is required";
    else if (!phoneRegex.test(phoneDigits))
      newErrors.phone = "Invalid phone number (10 digits)";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "phone" ? value.replace(/[^\d]/g, "") : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const shippingAddress = {
      address: formData.address,
      city: formData.city,
      landmark: formData.landmark,
      province: selectedProvince,
      district: selectedDistrict,
      municipality: selectedMunicipality,
      location: locationPinned ? userLocation : null,
    };

    // 1) validate first
    if (!validateForm()) return;

    try {
      // 2) if not logged in, save form + bounce to auth
      if (!authUser) {
        sessionStorage.setItem(
          "formData",
          JSON.stringify({ ...formData, shippingAddress })
        );
        return navigate("/auth", {
          state: { fromCheckout: reactLocation.pathname === "/checkout" },
        });
      }

      // 3) save shipping address if missing
      if (
        !authUser?.shippingAddress?.province ||
        !authUser?.shippingAddress?.district ||
        !authUser?.shippingAddress?.municipality
      ) {
        await axiosInstance.post(
          `/shippingaddress/${authUser._id}`, // NOTE: backticks + correct path
          shippingAddress
        );
      }

      setIsOrdering(true);

      // 4) build items now (BEFORE using it)
      const items = toServerItems();
      if (!items.length) {
        setIsOrdering(false);
        toast.error("Your cart is empty or items are invalid.");
        return;
      }

      console.log("POST /payments/create-intent payload:", {
        customerEmail: formData.email || authUser?.email,
        items,
      });

      // 5) create PI
      const resp = await axiosInstance.post("/payments/create-intent", {
        customerEmail: formData.email || authUser?.email,
        items, // [{ productId, qty, variantSku }]
      });
      const data = resp.data;

      if (!data?.clientSecret) {
        setIsOrdering(false);
        toast.error("Failed to initialize payment");
        return;
      }

      // optional diagnostics from server if you returned them
      setPiInfo({
        id: data.paymentIntentId || "",
        livemode: !!data.livemode,
        account: data.account || "",
      });

      // 6) open pay modal
      setClientSecret(data.clientSecret);
      setShowPay(true);
      setCardComplete(false);
      setIsOrdering(false);
    } catch (error) {
      console.error("Error starting checkout: ", error);
      setIsOrdering(false);
      toast.error(error?.response?.data?.error || "Failed to start payment");
    }
  };

  useEffect(() => {
    if (showPay && liveCardElRef.current) {
      setCardReady(true);
    }
  }, [showPay]);

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
                    value={formData.lastName}
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

              {/* Province → District → Address */}
              <div className="w-full mx-auto border rounded shadow bg-white">
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
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-200"
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
                ? buynow.map((item, i) => (
                    <div
                      key={`${item._id || item.id || "noid"}-${
                        item.variantSku || "novar"
                      }-${i}`}
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
                        </p>
                      </div>
                    </div>
                  ))
                : cartItems.map((item, i) => (
                    <div
                      key={`${item._id || item.id || "noid"}-${
                        item.variantSku || "novar"
                      }-${i}`}
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

      {/* --- Pay modal (always mounted, just hidden when closed) --- */}
      <PayModal
        open={showPay}
        onClose={() => !paying && setShowPay(false)}
        onPay={handlePayNow}
        paying={paying}
        onCardReady={(ready) => setCardReady(ready)}
        onCardChange={(complete) => setCardComplete(complete)}
        canPay={cardReady && cardComplete}
        cardOptions={cardOptions}
        setLiveCardRef={(el) => {
          // In StrictMode, onReady can fire twice; keep the last non-null ref
          if (el) liveCardElRef.current = el;
        }}
      />
    </div>
  );
};

export default Checkout;
