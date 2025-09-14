import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore"; // Adjust path as needed
import toast from "react-hot-toast";

export default function AuthSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle } = useAuthStore();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const name = query.get("name");
    const email = query.get("email");

    if (email && name) {
      loginWithGoogle({ name, email });
      navigate("/");
    } else {
      toast.error("Failed to log in with Google");
      navigate("/auth");
    }
  }, []);

  return (
    <div className="text-center mt-20 text-xl font-semibold text-gray-700">
      Logging you in via Google...
    </div>
  );
}
