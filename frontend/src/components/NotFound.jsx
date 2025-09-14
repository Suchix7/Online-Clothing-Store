import React from "react";

import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Navbar from "./Navbar";

const NotFound = () => {
  return (
    <div>
      <Navbar />
      <div className="min-h-min p-40">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-800">404</h1>
          <p className="text-xl text-gray-600 mt-2">Oops! Page Not Found</p>
          <p className="text-gray-500 mt-4">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block px-6 py-3 text-white bg-black rounded-lg shadow-md hover:bg-[#487984] transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
