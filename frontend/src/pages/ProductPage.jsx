import { useLocation, useParams, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductDetails from "../components/ProductDetails";

const ProductPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const fromListing = location.state?.fromListing;
  const fromBrands = location.state?.fromBrands;

  const handleBack = () => {
    if (fromListing) {
      // Navigate back to products list with state indicating we're returning from product page
      navigate("/products", {
        state: {
          fromProduct: true,
          timestamp: Date.now(), // Add timestamp to force state update
        },
      });
    } else if (fromBrands) {
      // Navigate back to brand page with state
      navigate(-1, {
        state: {
          fromProduct: true,
          timestamp: Date.now(),
        },
      });
    } else {
      // Default navigation
      navigate("/");
    }
  };

  return (
    <div>
      <ProductDetails onBack={handleBack} />
    </div>
  );
};

export default ProductPage;
