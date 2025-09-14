import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { FaBox, FaShippingFast, FaCheckCircle, FaUndo } from "react-icons/fa";
import { axiosInstance } from "../lib/axiosInstance.js";
import { useAuthStore } from "../store/useAuthStore.js";
import SvgLoader from "./SvgLoader.jsx";

const Order = ({ profilePage }) => {
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!authUser?._id) return navigate("/");
        const response = await axiosInstance.get(`/orders/${authUser._id}`);
        setOrders(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.log("Error while fetching orders: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?._id]);

  // Scroll to a specific order card if ?id=<orderId> is present
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;

    const timer = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("ring-2", "ring-indigo-500", "ring-offset-2");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-indigo-500", "ring-offset-2");
        }, 2400);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchParams, orders]);

  return (
    <div
      className={`mx-auto max-w-7xl ${
        profilePage ? "" : "px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      }`}
    >
      <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-8">
        Your Orders
      </h3>

      {!loading ? (
        orders.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            {orders.map((order) => (
              <OrderCard key={order._id || order.orderId} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-sm sm:text-base text-gray-600 bg-white rounded-lg shadow p-4 sm:p-6">
            No orders yet.{" "}
            <Link to="/" className="text-indigo-600 underline">
              Shop now
            </Link>{" "}
            to see your orders here.
          </div>
        )
      ) : (
        <div className="flex justify-center items-center py-10">
          <SvgLoader />
        </div>
      )}
    </div>
  );
};

const OrderCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (order.status) {
      case "processing":
        return <FaBox className="shrink-0" />;
      case "shipped":
        return <FaShippingFast className="shrink-0" />;
      case "delivered":
        return <FaCheckCircle className="shrink-0" />;
      case "returned":
        return <FaUndo className="shrink-0" />;
      default:
        return <FaBox className="shrink-0" />;
    }
  };

  const getStatusColor = () => {
    switch (order.status) {
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "returned":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const total = Number(order?.totalAmount ?? 0).toFixed(2);
  const createdAt = order?.createdAt
    ? new Date(order.createdAt).toLocaleString()
    : "";

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      id={order.orderId}
    >
      {/* Header */}
      <button
        type="button"
        className="w-full text-left p-3 sm:p-4 md:p-5 cursor-pointer flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        onClick={() => setExpanded((s) => !s)}
        aria-expanded={expanded}
        aria-controls={`order-panel-${order.orderId}`}
      >
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div className="text-lg sm:text-xl md:text-2xl">
            {getStatusIcon()}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base md:text-lg truncate">
              Order #<span className="break-all">{order.orderId}</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 leading-5">
              {createdAt}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="text-right">
            <p className="text-[11px] sm:text-xs text-gray-500">Total</p>
            <p className="font-semibold text-sm sm:text-base">${total}</p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor()}`}
          >
            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
          </span>
          <svg
            className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div
          id={`order-panel-${order.orderId}`}
          className="border-t p-3 sm:p-4 md:p-5"
        >
          {/* Items */}
          <div className="mb-4 sm:mb-6">
            <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">
              Items
            </h4>
            <div className="space-y-3">
              {order.products?.map((item) => (
                <div
                  key={item.productId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-md border border-gray-200 bg-white"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base font-medium">
                    ${Number(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                Shipping Details
              </h4>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-md">
                <ShippingProgress status={order.status} />
              </div>
              {order.trackingNumber && (
                <p className="mt-2 text-xs sm:text-sm">
                  Tracking #:
                  <span className="font-medium ml-1 break-all">
                    {order.trackingNumber}
                  </span>
                </p>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                Payment Information
              </h4>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-md">
                <p className="text-xs sm:text-sm flex flex-wrap items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${
                      order.paymentStatus === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.paymentStatus?.charAt(0).toUpperCase() +
                      order.paymentStatus?.slice(1)}
                  </span>
                </p>
                {order.transactionId && (
                  <p className="text-xs sm:text-sm mt-2 break-all">
                    <span className="font-medium">Transaction ID:</span>{" "}
                    {order.transactionId}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ShippingProgress = ({ status }) => {
  const steps = [
    { id: "processing", label: "Processing" },
    { id: "shipped", label: "Shipped" },
    { id: "delivered", label: "Delivered" },
  ];

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200">
        <div
          className={`absolute left-0 top-0 w-0.5 ${
            status === "processing"
              ? "h-1/3 bg-blue-500"
              : status === "shipped"
              ? "h-2/3 bg-blue-500"
              : status === "delivered"
              ? "h-full bg-green-500"
              : "h-0 bg-gray-200"
          }`}
        />
      </div>

      <div className="space-y-4 sm:space-y-6">
        {steps.map((step, index) => {
          const active = status === step.id;
          const shippedBefore = status === "shipped" && index < 1;
          const deliveredBefore = status === "delivered" && index < 2;
          return (
            <div key={step.id} className="relative pl-10">
              <div
                className={`absolute left-0 top-0 w-4 h-4 rounded-full ${
                  active
                    ? "bg-blue-500 ring-4 ring-blue-200"
                    : deliveredBefore
                    ? "bg-green-500"
                    : shippedBefore
                    ? "bg-blue-500"
                    : "bg-gray-300"
                }`}
              />
              <p
                className={`text-sm ${
                  active
                    ? "font-medium text-blue-600"
                    : deliveredBefore
                    ? "font-medium text-green-600"
                    : shippedBefore
                    ? "font-medium text-blue-600"
                    : "text-gray-500"
                }`}
              >
                {step.label}
              </p>
              {active && (
                <p className="text-xs text-gray-500 mt-1">
                  {step.id === "processing" && "Your order is being prepared"}
                  {step.id === "shipped" && "Your order is on the way"}
                  {step.id === "delivered" && "Your order has been delivered"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Order;
