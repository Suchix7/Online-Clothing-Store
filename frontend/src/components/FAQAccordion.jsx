import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useEffect } from "react";

const FAQAccordion = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const location = useLocation();

  const faqMap = {
    refund: 0,
    return: 1,
    exchange: 2,
    warranty: 3,
    shipping: 4, // This is the index for Shipping Guidelines
    privacy: 5,
    terms: 6,
    rights: 7,
    payment: 8,
    contact: 9,
  };
  // Check URL hash on component mount and when location changes
  useEffect(() => {
    if (location.hash) {
      const hash = location.hash.replace("#", "");
      if (faqMap[hash] !== undefined) {
        setActiveIndex(faqMap[hash]);

        // Scroll to the section after a slight delay to allow rendering
        setTimeout(() => {
          const element = document.getElementById(`section-${hash}`);
          if (element) {
            const yOffset = -80; // adjust this value based on your header height
            const y =
              element.getBoundingClientRect().top +
              window.pageYOffset +
              yOffset;
            window.scrollTo({ top: y, behavior: "smooth" });
          }
        }, 100);
      }
    }
  }, [location]);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };
  const faqData = [
    {
      question: "1. Refund Policy",
      answer: (
        <>
          <p className="mb-3">
            We aim to provide a smooth and transparent refund process. Refunds
            are available under the following conditions:
          </p>
          <p className="font-semibold text-green-600 mb-1">
            ✅ Refund Criteria:
          </p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>
              The item must be returned in its original condition, unused, and
              with all original packaging intact.
            </li>
            <li>
              Refunds will be processed within 5-7 business days after we
              receive and inspect the returned item.
            </li>
            <li>
              Refunds are issued either via bank transfer or cash (for in-person
              transactions).
            </li>
          </ul>
          <p className="font-semibold text-red-600 mb-1">
            ❗ Non-Refundable Items:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Items with damaged packaging, missing accessories, or signs of use
              may not qualify for a refund.
            </li>
            <li>
              Certain products like earphones, headphones, and personal hygiene
              products are non-refundable unless faulty.
            </li>
          </ul>
        </>
      ),
    },
    {
      question: "2. Return Policy",
      answer: (
        <>
          <p className="mb-3">
            We understand that sometimes products may need to be returned.
            Here's how you can initiate a return:
          </p>
          <p className="font-semibold text-green-600 mb-1">
            ✅ Return Criteria:
          </p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>
              The product must be in good condition with its original box,
              labels, and accessories.
            </li>
            <li>Items should be returned within 7 days of delivery.</li>
          </ul>
          <p className="font-semibold text-blue-600 mb-1">📞 How to Return:</p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>Contact our Customer Support to initiate a return.</li>
            <li>
              Alternatively, you can request a return directly from the website,
              and our team will arrange a pickup service for your convenience.
            </li>
          </ul>
          <p className="font-semibold text-red-600 mb-1">
            ❗ Non-Returnable Items:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Products that have been damaged, tampered with, or show signs of
              use beyond reasonable handling may not be eligible for returns.
            </li>
          </ul>
        </>
      ),
    },
    {
      question: "3. Exchange Policy",
      answer: (
        <>
          <p className="mb-3">
            We are happy to offer exchanges under specific conditions to ensure
            fairness for both parties.
          </p>
          <p className="font-semibold text-green-600 mb-1">
            ✅ Exchange Criteria:
          </p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>
              The item must be in its original condition, unused, and with no
              visible signs of damage.
            </li>
            <li>The original box, labels, and accessories must be intact.</li>
            <li>
              Sealed products (e.g., smartphones) must have their seal unbroken.
            </li>
          </ul>
          <p className="font-semibold text-blue-600 mb-1">
            📦 How to Exchange:
          </p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>Contact our Customer Support for exchange requests.</li>
            <li>Exchanges are subject to product availability.</li>
          </ul>
          <p className="font-semibold text-red-600 mb-1">
            ❗ Non-Exchangeable Items:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Items with damaged packaging, missing accessories, or signs of use
              may not qualify for an exchange.
            </li>
          </ul>
        </>
      ),
    },
    {
      question: "4. Warranty Policy",
      answer: (
        <>
          <p className="mb-3">
            We offer a warranty period to provide peace of mind for your
            purchases.
          </p>
          <p className="font-semibold text-green-600 mb-1">
            ✅ Warranty Coverage:
          </p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>
              The warranty applies only to products that experience
              manufacturing defects or hardware malfunctions.
            </li>
            <li>
              The warranty period may vary by product. Please refer to the
              product details for specific coverage periods.
            </li>
            <li>
              Warranty claims will be processed after proper inspection by our
              technical team.
            </li>
          </ul>
          <p className="font-semibold text-red-600 mb-1">
            ❗ Warranty Exclusions:
          </p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>
              Physical damage caused by accidents, misuse, or improper handling
              is not covered.
            </li>
            <li>
              Issues caused by unauthorized repairs, modifications, or software
              tampering will void the warranty.
            </li>
            <li>
              Consumable items such as charging cables, batteries, and earphones
              may have limited or no warranty unless specified.
            </li>
          </ul>
          <p className="font-semibold text-blue-600 mb-1">
            📞 How to Claim Warranty:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Contact our Customer Support with your purchase receipt and a
              detailed description of the issue.
            </li>
            <li>
              Products must be returned in their original box with all included
              accessories.
            </li>
          </ul>
        </>
      ),
    },
    {
      question: "5. Shipping Guidelines",
      answer: (
        <>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>Orders are typically processed within 1-2 business days.</li>
            <li>
              Delivery time may vary based on location, product availability,
              and courier services.
            </li>
          </ul>
          <p className="font-semibold text-red-600 mb-1">❗ Important Notes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Customers are responsible for providing an accurate delivery
              address.
            </li>
            <li>
              If a package is returned to us due to an incorrect address or
              multiple delivery attempts, additional delivery fees may apply.
            </li>
          </ul>
        </>
      ),
    },
    {
      question: "6. Privacy Policy",
      answer: (
        <>
          <p className="mb-3">
            We are committed to protecting your personal information.
          </p>
          <p className="font-semibold text-green-600 mb-1">
            ✅ Information We Collect:
          </p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>
              Personal details such as your name, email, phone number, and
              delivery address.
            </li>
            <li>Transaction details for order processing.</li>
            <li>
              Data collected via cookies to improve website functionality and
              customer experience.
            </li>
          </ul>
          <p className="font-semibold text-green-600 mb-1">
            ✅ How We Use Your Information:
          </p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>To process orders, deliver products, and provide support.</li>
            <li>
              To send promotional offers, which you can opt out of anytime.
            </li>
            <li>
              To improve our platform by analyzing customer preferences and
              behaviors.
            </li>
          </ul>
          <p className="font-semibold text-red-600 mb-1">
            ❗ Your Information is Safe with Us:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              We do not sell or share your data with third-party advertisers.
            </li>
            <li>
              Your data is stored securely, and only authorized personnel have
              access.
            </li>
          </ul>
        </>
      ),
    },
    {
      question: "7. Terms of Service",
      answer: (
        <>
          <p className="mb-3">
            By using the YugTech website, you agree to the following terms:
          </p>
          <p className="font-semibold text-green-600 mb-1">
            ✅ Account Creation:
          </p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>
              Users must provide accurate information during registration.
            </li>
            <li>
              You are responsible for keeping your login credentials secure.
            </li>
          </ul>
          <p className="font-semibold text-green-600 mb-1">
            ✅ Product Listings & Availability:
          </p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>
              Product prices and availability are subject to change without
              notice.
            </li>
            <li>
              Orders may be cancelled if an item is out of stock or if there's a
              pricing error.
            </li>
          </ul>
          <p className="font-semibold text-green-600 mb-1">
            ✅ Usage Restrictions:
          </p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>
              Misuse of the website, such as attempting to breach security or
              engaging in fraudulent activities, will result in immediate
              account suspension.
            </li>
          </ul>
          <p className="font-semibold text-red-600 mb-1">
            ❗ Violation of Terms:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Any violation of these terms may result in your account being
              suspended or permanently removed.
            </li>
          </ul>
        </>
      ),
    },
    {
      question: "8. Customer Rights",
      answer: (
        <>
          <p className="mb-3">
            At YugTech, we prioritize customer satisfaction and fair treatment.
          </p>
          <p className="font-semibold text-green-600 mb-1">
            ✅ Your Rights as a Customer:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              The right to receive accurate product information before purchase.
            </li>
            <li>
              The right to request refunds, returns, or exchanges under our
              policies.
            </li>
            <li>The right to privacy, ensuring your data is kept secure.</li>
            <li>
              The right to speak to a manager or file a complaint if unsatisfied
              with our services.
            </li>
          </ul>
        </>
      ),
    },
    {
      question: "9. Payment Policy",
      answer: (
        <>
          <p className="font-semibold text-green-600 mb-1">
            ✅ Accepted Payment Methods:
          </p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>Cash on Delivery (COD)</li>
            <li>Bank Transfers</li>
            <li>Digital Wallets (e.g., eSewa, Khalti, etc.)</li>
          </ul>
          <p className="font-semibold text-green-600 mb-1">✅ Payment Terms:</p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>
              Payments must be made in full before or at the time of delivery.
            </li>
            <li>
              All prices are listed in Nepali Rupees (NPR) unless stated
              otherwise.
            </li>
          </ul>
          <p className="font-semibold text-red-600">
            ❗ We reserve the right to cancel any orders due to payment issues
            or fraudulent activities.
          </p>
        </>
      ),
    },
    {
      question: "10. Contact Us",
      answer: (
        <>
          <p className="mb-3">
            If you have any questions, concerns, or requests, our support team
            is available to assist you.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>📧 Email: testproject7828@gmail.com</li>
            <li>📞 Phone: +977-9851342116, +977-9848917128</li>
            <li>🕒 Customer Support Hours: 10 AM – 6 PM (Sunday – Friday)</li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-800 mb-3">Help Center</h2>
        <p className="text-lg text-gray-600">
          Find answers to common questions about our policies and services
        </p>
      </div>

      <div className="space-y-4">
        {faqData.map((item, index) => (
          <div
            key={index}
            id={`section-${Object.keys(faqMap).find(
              (key) => faqMap[key] === index
            )}`}
            className={`border rounded-xl overflow-hidden transition-all duration-200 shadow-sm
            ${
              activeIndex === index
                ? "border-blue-300 shadow-md"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <button
              onClick={() => toggleAccordion(index)}
              className={`w-full px-6 py-5 text-left flex justify-between items-center transition-colors duration-200
              ${
                activeIndex === index
                  ? "bg-gradient-to-r from-blue-50 to-blue-100"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              <span className="text-lg font-semibold text-gray-800">
                {item.question}
              </span>
              {activeIndex === index ? (
                <FiChevronUp className="text-blue-500 text-xl" />
              ) : (
                <FiChevronDown className="text-gray-500 text-xl" />
              )}
            </button>

            <div
              className={`transition-all duration-300 overflow-hidden
              ${
                activeIndex === index
                  ? "max-h-[1000px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-6 py-4 bg-white text-gray-700">
                <div className="prose prose-blue max-w-none">{item.answer}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* <div className="mt-12 bg-blue-50 rounded-xl p-6 text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          Still have questions?
        </h3>
        <p className="text-gray-600 mb-4">
          Our customer support team is here to help you
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200">
          Contact Support
        </button>
      </div> */}
    </div>
  );
};

export default FAQAccordion;
