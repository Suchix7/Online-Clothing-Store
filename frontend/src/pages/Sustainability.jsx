"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Leaf,
  Recycle,
  Truck,
  Building,
  Users,
  Globe,
} from "lucide-react";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
export default function SustainabilitySection() {
  const [isVisible, setIsVisible] = useState({
    section1: false,
    section2: false,
    section3: false,
    section4: false,
  });

  const section1Ref = useRef(null);
  const section2Ref = useRef(null);
  const section3Ref = useRef(null);
  const section4Ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === section1Ref.current) {
            setIsVisible((prev) => ({
              ...prev,
              section1: entry.isIntersecting,
            }));
          } else if (entry.target === section2Ref.current) {
            setIsVisible((prev) => ({
              ...prev,
              section2: entry.isIntersecting,
            }));
          } else if (entry.target === section3Ref.current) {
            setIsVisible((prev) => ({
              ...prev,
              section3: entry.isIntersecting,
            }));
          } else if (entry.target === section4Ref.current) {
            setIsVisible((prev) => ({
              ...prev,
              section4: entry.isIntersecting,
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    if (section1Ref.current) observer.observe(section1Ref.current);
    if (section2Ref.current) observer.observe(section2Ref.current);
    if (section3Ref.current) observer.observe(section3Ref.current);
    if (section4Ref.current) observer.observe(section4Ref.current);

    return () => {
      if (section1Ref.current) observer.unobserve(section1Ref.current);
      if (section2Ref.current) observer.unobserve(section2Ref.current);
      if (section3Ref.current) observer.unobserve(section3Ref.current);
      if (section4Ref.current) observer.unobserve(section4Ref.current);
    };
  }, []);

  return (
    <div className="font-sans text-gray-900 overflow-hidden">
      <TopBar />
      <Navbar />
      {/* Section 1 - Hero with Video Background */}
      <section
        ref={section1Ref}
        className={`relative min-h-screen flex items-center transition-opacity duration-1000 ease-in-out ${
          isVisible.section1 ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute w-full h-full object-cover"
          >
            <source src="/nature_sustainability.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70"></div>
        </div>

        <div className="container mx-auto px-6 z-10 pt-24">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-5xl md:text-7xl font-medium tracking-tight mb-8 animate-fade-in">
              Our Path to a Greener Future
            </h1>
            <p className="text-xl md:text-2xl font-light leading-relaxed mb-12 animate-fade-in-delay">
              At Yug Industries, we consider sustainability at every step — from
              sourcing and production to delivery, usage, and recycling.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl transition-all duration-500 hover:bg-white/20 hover:scale-105 border border-white/20">
                <Leaf className="w-10 h-10 text-green-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">
                  Energy-efficient solutions
                </h3>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl transition-all duration-500 hover:bg-white/20 hover:scale-105 border border-white/20">
                <Recycle className="w-10 h-10 text-green-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">
                  Reducing waste through recycling
                </h3>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl transition-all duration-500 hover:bg-white/20 hover:scale-105 border border-white/20">
                <Truck className="w-10 h-10 text-green-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">
                  Smarter logistics and digital operations
                </h3>
              </div>
            </div>

            <p className="text-xl mt-16 animate-fade-in-delay-2">
              Our goal is to grow responsibly while protecting the planet we all
              share.
            </p>
            <p className="text-2xl font-medium mt-4 animate-fade-in-delay-3">
              Small things matter to a greener future
            </p>
          </div>
        </div>
      </section>

      {/* Section 2 - Commitment */}
      <section
        ref={section2Ref}
        className={`py-24 bg-gradient-to-b from-[#f0f7f4] to-white transition-all duration-1000 ease-in-out ${
          isVisible.section2
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="w-full md:w-1/2 relative h-[400px] rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/plant-growth.jpg"
                  alt="Sustainable technology with plants"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full md:w-1/2 space-y-6">
                <h2 className="text-3xl md:text-4xl font-medium text-gray-900">
                  Sustainability Commitment at Yug Industries
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  At Yug Industries, we recognize our responsibility to build a
                  sustainable future. As we expand our business in technology,
                  real estate, hospitality, and travel, we are committed to
                  integrating eco-friendly practices into our operations. Our
                  approach to sustainability focuses on three key areas:
                </p>
                <button className="group flex items-center text-lg font-medium text-[#34a853] hover:text-[#2d8e47] transition-colors">
                  Learn more about our approach
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 - Three Key Areas */}
      <section
        ref={section3Ref}
        className={`py-24 bg-white transition-all duration-1000 ease-in-out ${
          isVisible.section3
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Eco-Friendly Operations */}
              <div className="bg-gradient-to-br from-[#e8f5e9] to-[#e0f2f1] p-8 rounded-3xl shadow-sm transition-all duration-500 hover:shadow-md hover:translate-y-[-8px] border border-[#c8e6c9]/50">
                <div className="w-16 h-16 rounded-full bg-[#a5d6a7] flex items-center justify-center mb-6">
                  <Leaf className="w-8 h-8 text-[#1b5e20]" />
                </div>
                <h3 className="text-2xl font-medium mb-4 text-[#2e7d32]">
                  ♻️ Eco-Friendly Operations & Products
                </h3>
                <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start">
                    <span className="font-medium mr-2">•</span>
                    <span>
                      <span className="font-medium">Sustainable Sourcing:</span>{" "}
                      We prioritize eco-friendly and energy-efficient technology
                      products at YugTech.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">•</span>
                    <span>
                      <span className="font-medium">E-Waste Management:</span>{" "}
                      Implementing programs to recycle and responsibly dispose
                      of electronic waste.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">•</span>
                    <span>
                      <span className="font-medium">Energy Efficiency:</span>{" "}
                      Using renewable energy solutions in our offices and future
                      warehouses to reduce carbon footprints.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Green Business Practices */}
              <div className="bg-gradient-to-br from-[#e3f2fd] to-[#e1f5fe] p-8 rounded-3xl shadow-sm transition-all duration-500 hover:shadow-md hover:translate-y-[-8px] border border-[#b3e5fc]/50">
                <div className="w-16 h-16 rounded-full bg-[#81d4fa] flex items-center justify-center mb-6">
                  <Building className="w-8 h-8 text-[#01579b]" />
                </div>
                <h3 className="text-2xl font-medium mb-4 text-[#0277bd]">
                  Green Business Practices
                </h3>
                <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start">
                    <span className="font-medium mr-2">•</span>
                    <span>
                      <span className="font-medium">
                        Paperless Transactions:
                      </span>{" "}
                      Encouraging digital invoices, e-receipts, and online
                      communication to minimize waste.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">•</span>
                    <span>
                      <span className="font-medium">Smart Logistics:</span>{" "}
                      Optimizing delivery routes to reduce fuel consumption and
                      emissions.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">•</span>
                    <span>
                      <span className="font-medium">
                        Eco-Friendly Office Culture:
                      </span>{" "}
                      Reducing plastic use, conserving water, and promoting
                      sustainable work habits among employees.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Social & Community Responsibility */}
              <div className="bg-gradient-to-br from-[#f3e5f5] to-[#ede7f6] p-8 rounded-3xl shadow-sm transition-all duration-500 hover:shadow-md hover:translate-y-[-8px] border border-[#d1c4e9]/50">
                <div className="w-16 h-16 rounded-full bg-[#b39ddb] flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-[#4527a0]" />
                </div>
                <h3 className="text-2xl font-medium mb-4 text-[#5e35b1]">
                  🤝 Social & Community Responsibility
                </h3>
                <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start">
                    <span className="font-medium mr-2">•</span>
                    <span>
                      <span className="font-medium">
                        Local Sourcing & Employment:
                      </span>{" "}
                      Supporting Nepali suppliers and manufacturers,
                      strengthening the local economy.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">•</span>
                    <span>
                      <span className="font-medium">
                        Sustainable Real Estate Development 🏡:
                      </span>{" "}
                      In YugRoom, ensuring energy-efficient housing solutions
                      for property seekers.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">•</span>
                    <span>
                      <span className="font-medium">
                        Green Tourism Initiatives:
                      </span>{" "}
                      In YugTravel, promoting eco-friendly travel packages and
                      working with sustainable tourism partners.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center mt-16">
              <p className="text-xl font-medium text-gray-900">
                At Yug Industries, sustainability is not just a choice—it's our
                responsibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 - Future */}
      <section
        ref={section4Ref}
        className={`py-24 relative transition-all duration-1000 ease-in-out ${
          isVisible.section4
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        <div className="absolute inset-0 z-0">
          <img
            src="/forest-canopy.jpg"
            alt="Sustainable future concept with green technology"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1b5e20]/90 to-[#2e7d32]/70"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-block p-3 rounded-full bg-white/10 backdrop-blur-sm mb-8">
              <Globe className="w-12 h-12 text-[#a5d6a7]" />
            </div>

            <h2 className="text-4xl md:text-5xl font-medium mb-8">
              🌟 The Future of Sustainability at Yug Industries
            </h2>

            <p className="text-xl leading-relaxed mb-12">
              Our long-term goal is to set an example in Nepal's business sector
              by showing that profitability and sustainability can go hand in
              hand. We are constantly exploring innovative solutions to minimize
              our environmental impact while delivering high-quality services.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl transition-all duration-300 hover:bg-white/20 border border-white/20">
                <h3 className="text-xl font-medium mb-2">
                  Carbon Neutral by 2030
                </h3>
                <p className="text-[#c8e6c9]">
                  Our commitment to eliminate our carbon footprint
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl transition-all duration-300 hover:bg-white/20 border border-white/20">
                <h3 className="text-xl font-medium mb-2">
                  100% Renewable Energy
                </h3>
                <p className="text-[#c8e6c9]">
                  Transitioning all operations to clean energy sources
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl transition-all duration-300 hover:bg-white/20 border border-white/20">
                <h3 className="text-xl font-medium mb-2">
                  Zero Waste Operations
                </h3>
                <p className="text-[#c8e6c9]">
                  Eliminating waste across our business ecosystem
                </p>
              </div>
            </div>
            <Link to="/">
              <button className="mt-12 px-8 py-4 bg-white text-[#2e7d32] rounded-full font-medium transition-all duration-300 hover:bg-[#e8f5e9] hover:shadow-lg">
                Join our sustainability journey
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
