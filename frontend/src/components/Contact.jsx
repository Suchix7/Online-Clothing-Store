import React, { useState } from "react";
import {
  FaHeadset,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaPaperPlane,
} from "react-icons/fa";
import { axiosInstance } from "../lib/axiosInstance.js";
import toast from "react-hot-toast";
import { Loader } from "lucide-react";

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axiosInstance.post("/contactus", data);

      toast.success(response.data.message);
      setLoading(false);
    } catch (error) {
      toast.error("Couldn't sent email! Try again later.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Get in Touch
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions? Our team is ready to assist you.
          </p>
        </div>

        {/* Grid Layout (Form + Image) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Contact Form */}
          <div className="p-10 md:p-14">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={data.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-5 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={data.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-5 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700"
                >
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={data.message}
                  onChange={handleInputChange}
                  rows="5"
                  required
                  className="mt-1 block w-full px-5 py-3 rounded-xl border resize-none border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  placeholder="How can we help?"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 px-6 rounded-xl hover:bg-gray-800 transition duration-300 font-medium shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" /> Send Message
                  </>
                ) : (
                  <>
                    <FaPaperPlane /> Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Image & Contact Info */}
          <div className="relative bg-gray-900 h-full hidden lg:block">
            {/* Overlay for better text contrast */}
            <div className="absolute inset-0 bg-black opacity-20 z-10"></div>

            {/* High-quality e-commerce image */}
            <img
              src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
              alt="E-commerce Support"
              className="w-full h-full object-cover"
            />

            {/* Contact Info (floating over image) */}
            <div className="absolute inset-0 z-20 flex flex-col justify-center p-12 text-white space-y-8">
              <h2 className="text-3xl font-bold">We're Here to Help</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <FaHeadset className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold">24/7 Support</h3>
                    <p className="text-gray-300">Chat with us anytime.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <FaMapMarkerAlt className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Our Location</h3>
                    <p className="text-gray-300">Sydney, Australia</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <FaEnvelope className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email Us</h3>
                    <p className="text-gray-300">testproject7828@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <FaPhone className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Call Us</h3>
                    <p className="text-gray-300">
                      +977-9851342116, +977-9848917128
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
