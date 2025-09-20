import { createRoot } from "react-dom/client";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import App from "./App.jsx";
import "./index.css";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const elementsOptions = {};

createRoot(document.getElementById("root")).render(
  <Elements stripe={stripePromise} options={elementsOptions}>
    <App />
  </Elements>
);
