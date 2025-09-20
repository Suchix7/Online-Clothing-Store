import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axiosInstance.js";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { useNavigate } from "react-router-dom";

const QRCodeComponent = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    QRCode.toDataURL("https://www.try.com/install?install=true")
      .then((url) => {
        setQrCodeUrl(url);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    <div className="space-y-2 flex justify-start lg:justify-start md:justify-start">
      {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" />}
    </div>
  );
};

const Footer = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  const handleCategory = (category) => {
    navigate("/products", { state: { selectedCategory: category } });
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get("/category");
        const data = response.data.map((category) => ({
          id: category._id,
          name: category.categoryName,
          image: category.image,
        }));
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
      }
    };

    fetchCategories();
  }, []);

  return (
    <footer className="bg-[#2C3E50] text-white py-10 border-t border-gray-300">
      <div className="px-4 md:px-8 lg:px-40">
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 p-4">
            {/* Contact Information */}
            <div>
              <p className="text-xl  mb-4  "> Style iconic</p>
              <div className="flex sm:justify-start items-center mb-3">
                <div>
                  <p>
                    Your destination for trendy fashion with AI- Powered try-on
                    Technology.
                  </p>
                </div>
              </div>
            </div>
            <div className="sm:text-left">
              <p className="text-xl  mb-4  "> Quick Links</p>
              <ul className="space-y-2">
                <li className="flex items-center sm:justify-start">
                  <Link to="/help" className="hover:underline">
                    FAQ
                  </Link>
                </li>
                <li className="flex items-center sm:justify-start">
                  <Link to="/aboutus" className="hover:underline">
                    About Us
                  </Link>
                </li>

                <li className="flex items-center sm:justify-start">
                  <Link to="/help#return" className="hover:underline">
                    Return Policy
                  </Link>
                </li>

                <li className="flex items-center sm:justify-start">
                  <Link to="/help#contact" className="hover:underline">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div className="sm:text-left">
              <p className="text-xl  mb-4  ">Our Products</p>
              <ul className="space-y-2 list-none">
                {categories &&
                  categories.map((item) => {
                    return (
                      <li
                        className="flex items-center sm:justify-start"
                        key={item.name}
                      >
                        <a
                          className="hover:underline cursor-pointer"
                          onClick={() => handleCategory(item.name)}
                        >
                          {item.name}
                        </a>
                      </li>
                    );
                  })}
              </ul>
            </div>

            {/* Our Company */}
            <div className="sm:text-left">
              <p className="text-xl mb-4 flex">Newsletter</p>
              <div className="flex w-full flex-col lg:flex-row">
                <input
                  type="text"
                  placeholder="Enter your email"
                  className="flex-grow rounded-l-md border  bg-white px-4 py-2 text-black focus:outline-none "
                />
                <button className="rounded-r-md bg-orange-600 px-6 py-2 text-white hover:bg-orange-700">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-300 mt-8 pt-6 text-center text-sm sm:text-base">
        <p>© 2025 All rights reserved. Online Clothing Store.</p>
      </div>
    </footer>
  );
};

export default Footer;
