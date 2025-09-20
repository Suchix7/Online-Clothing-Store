import { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const AboutPage = () => {
  const [activeTab, setActiveTab] = useState("company");
  const [scrollY, setScrollY] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const teamMembers = [
    {
      id: 1,
      name: "Anish Shrestha",
      role: "CEO & Founder",
      image:
        "https://res.cloudinary.com/dzgwsrqnf/image/upload/v1745391254/anish_jt3pgx.jpg",
      bio: "Visionary leader with 15+ years in tech innovation.",
    },
    {
      id: 2,
      name: "Manish Shrestha",
      role: "CFO",
      image:
        "https://res.cloudinary.com/dzgwsrqnf/image/upload/v1745391240/473409344_1380575199796190_87778_xny0ys.jpg",
      bio: "Finance strategist specializing in economy of the industry.",
    },
    {
      id: 3,
      name: "Sahil Shrestha",
      role: "COO",
      image:
        "https://res.cloudinary.com/dzgwsrqnf/image/upload/v1745341474/sahil_qklbq8.jpg",
      bio: "Operation Head focused on internal & external operations.",
    },
    {
      id: 4,
      name: "Abishek Shrestha",
      role: "CTO",
      image:
        "https://res.cloudinary.com/dzgwsrqnf/image/upload/v1745342609/abishek_vtwx72.jpg",
      bio: "Technical-Head with years of Experience in Frontend and technology working with data each and everyday.",
    },
    {
      id: 5,
      name: "Sujal Chitrakar",
      role: "IT Officer",
      image:
        "https://res.cloudinary.com/dzgwsrqnf/image/upload/v1745391240/WhatsApp_Image_2025-03-25_at_20.23.26_dqn6oi.jpg",
      bio: "Going to Head.",
    },
  ];

  const getMemberSocialLink = (memberId, platform) => {
    const socialLinks = {
      1: {
        linkedin: "https://linkedin.com/in/anish-example",
        twitter: "https://twitter.com/anish-example",
      },
      2: {
        linkedin: "https://linkedin.com/in/manish-example",
        twitter: "https://twitter.com/manish-example",
      },
      3: {
        linkedin: "https://linkedin.com/in/sahil-example",
        twitter: "https://twitter.com/sahil-example",
      },
      4: {
        linkedin: "https://linkedin.com/in/abishek-example",
        twitter: "https://twitter.com/abishek-example",
      },
      5: {
        linkedin: "https://linkedin.com/in/sujal-example",
        twitter: "https://twitter.com/sujal-example",
      },
    };
    return socialLinks[memberId]?.[platform] || "#";
  };

  const getMemberEmail = (memberId) => {
    const emails = {
      1: "anish@example.com",
      2: "manish@example.com",
      3: "sahil@example.com",
      4: "ab15h3kshrestha@example.com",
      5: "sujal@example.com",
    };
    return emails[memberId] || "contact@example.com";
  };

  return (
    <div className="bg-white text-gray-900 font-sans antialiased">
      <TopBar />
      <Navbar />

      {/* Hero Section */}
      <div className="relative lg:h-220 h-180 min-h-[600px] overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-white opacity-50 z-10"></div>

        {/* Parallax background */}
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-100"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`,
          }}
        ></div>

        <div className="relative z-20 h-full flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter bg-clip-text text-transparent bg-black">
            INNOVATING TOMORROW
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-10 text-gray-700">
            Pioneering technology solutions that redefine boundaries and create
            seamless experiences.
          </p>
          <a
            className="px-8 py-4 bg-black text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            href="#content"
          >
            Explore Our Journey
          </a>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-20 animate-bounce">
          <svg
            className="w-8 h-8 text-gray-900"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        className="sticky top-9 z-30 bg-white shadow-sm backdrop-blur-sm bg-opacity-90 lg:top-14"
        id="content"
      >
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-200">
            {[
              "company",
              "team",
              "values",
              "history",
              "Online Shopping Store",
            ].map((tab) => (
              <button
                key={tab}
                className={`px-6 py-4 font-medium text-sm uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab
                    ? "text-black-600 border-b-2 border-black-600"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-20 max-w-7xl">
        {/* Company Section */}
        {activeTab === "company" && (
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-4 shadow-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800">
                    Online Shopping Store
                  </h2>
                </div>

                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  A proud member of the{" "}
                  <span className="font-semibold text-black">
                    Online Shopping Store
                  </span>{" "}
                  family, committed to revolutionizing the tech shopping
                  experience in Australia. As a leading online technology
                  retailer, we offer a diverse range of high-quality products
                  designed for both individuals and businesses.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    {
                      title: "Smartphones & Tablets",
                      icon: (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      ),
                      bg: "bg-blue-50",
                    },
                    {
                      title: "Laptops & PCs",
                      icon: (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-black-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      ),
                      bg: "bg-black-50",
                    },
                    {
                      title: "Gaming Gear",
                      icon: (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                          />
                        </svg>
                      ),
                      bg: "bg-green-50",
                    },
                    {
                      title: "Smart Home",
                      icon: (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-orange-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                          />
                        </svg>
                      ),
                      bg: "bg-orange-50",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className={`${item.bg} p-4 rounded-lg flex items-center hover:shadow-md transition-shadow duration-300`}
                    >
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3 shadow-sm">
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  From the latest gadgets to essential tech accessories and home
                  appliances, we bring the world of technology to your
                  fingertips. Our collection includes refurbished options,
                  offering quality at great value while supporting
                  sustainability.
                </p>

                <p className="text-gray-600 leading-relaxed font-medium">
                  Whether you're upgrading your home, building your office
                  setup, or exploring innovations, Online Shopping Store is your
                  trusted source for everything tech in Australia.
                </p>
              </div>

              {/* Commitment Section */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl text-white shadow-xl">
                <h3 className="text-2xl font-bold mb-6">Our Commitment</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    "Genuine & Affordable Tech Products",
                    "Seamless Shopping & Secure Transactions",
                    "Fast & Reliable Delivery",
                    "Easy Returns & Customer Support",
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                    >
                      <svg
                        className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Visual Content */}
            <div className="space-y-8">
              {/* Image Placeholder */}
              <div className="relative rounded-2xl overflow-hidden h-80 bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg group">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 text-gray-400 mx-auto mb-4 group-hover:text-black transition-colors duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-gray-500 font-medium group-hover:text-gray-700 transition-colors duration-300">
                      Clothing products showcase
                    </p>
                  </div>
                </div>
              </div>

              {/* Vision Section */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <h2 className="text-3xl font-bold mb-6 text-gray-800">
                  Our Vision
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  We envision a world where technology seamlessly integrates
                  with daily life, enhancing human potential without complexity.
                  Our mission is to create intuitive, powerful solutions that
                  anticipate needs before they arise.
                </p>
                <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 p-4 rounded-r-lg">
                  <p className="text-black-800 font-medium">
                    "Bridging the gap between technology and convenience, making
                    it easier for customers to find the right tech products at
                    the right price."
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Section */}
        {activeTab === "team" && (
          <div>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Meet Our Leadership</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto"></div>
              <p className="text-xl text-gray-600 mt-6 max-w-2xl mx-auto">
                The brilliant minds driving innovation and growth at Online
                Shopping Store
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="relative group overflow-hidden rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500"
                  onMouseEnter={() => setHoveredCard(`member-${member.id}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="relative h-96">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-all duration-500 ${
                        hoveredCard === `member-${member.id}`
                          ? "opacity-100"
                          : "opacity-80"
                      }`}
                    ></div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-bold mb-1">{member.name}</h3>
                    <p className="text-white mb-3">{member.role}</p>
                    <div
                      className={`overflow-hidden transition-all duration-500 ${
                        hoveredCard === `member-${member.id}`
                          ? "max-h-20"
                          : "max-h-0"
                      }`}
                    >
                      <p className="text-gray-200">{member.bio}</p>
                    </div>
                    <div className="flex space-x-3 mt-4">
                      {[
                        {
                          name: "linkedin",
                          url: getMemberSocialLink(member.id, "linkedin"),
                          icon: (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                          ),
                        },
                        {
                          name: "twitter",
                          url: getMemberSocialLink(member.id, "twitter"),
                          icon: (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                            </svg>
                          ),
                        },
                        {
                          name: "email",
                          url: `mailto:${getMemberEmail(member.id)}`,
                          icon: (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M0 3v18h24v-18h-24zm6.623 7.929l-4.623 5.712v-9.458l4.623 3.746zm-4.141-5.929h19.035l-9.517 7.713-9.518-7.713zm5.694 7.188l3.824 3.099 3.83-3.104 5.612 6.817h-18.779l5.513-6.812zm9.208-1.264l4.616-3.741v9.348l-4.616-5.607z" />
                            </svg>
                          ),
                        },
                      ].map((social) => (
                        <a
                          key={social.name}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:-translate-y-1"
                          aria-label={`${member.name}'s ${social.name}`}
                        >
                          {social.icon}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Values Section */}
        {activeTab === "values" && (
          <div>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Our Core Values</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto"></div>
              <p className="text-xl text-gray-600 mt-6 max-w-2xl mx-auto">
                These principles guide every decision we make and every product
                we create.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Innovation",
                  icon: "💡",
                  description:
                    "We challenge conventions and push boundaries to create what's next.",
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  title: "Integrity",
                  icon: "🤝",
                  description:
                    "We do what's right, not what's easy, in all our relationships.",
                  color: "text-green-600",
                  bg: "bg-green-50",
                },
                {
                  title: "Excellence",
                  icon: "🏆",
                  description:
                    "We pursue mastery in every detail, delivering beyond expectations.",
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                },
                {
                  title: "Collaboration",
                  icon: "👥",
                  description:
                    "We believe diverse perspectives create the best solutions.",
                  color: "text-orange-600",
                  bg: "bg-orange-50",
                },
                {
                  title: "Sustainability",
                  icon: "🌱",
                  description:
                    "We design with the future in mind, minimizing our environmental impact.",
                  color: "text-teal-600",
                  bg: "bg-teal-50",
                },
                {
                  title: "Customer Focus",
                  icon: "❤️",
                  description:
                    "We start with user needs and work backward to create value.",
                  color: "text-red-500",
                  bg: "bg-red-50",
                },
              ].map((value, index) => (
                <div
                  key={index}
                  className={`${value.bg} p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 group`}
                  onMouseEnter={() => setHoveredCard(`value-${index}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div
                    className={`text-5xl mb-6 transition-all duration-300 ${
                      hoveredCard === `value-${index}`
                        ? "scale-110 rotate-6"
                        : ""
                    }`}
                  >
                    {value.icon}
                  </div>
                  <h3
                    className={`text-2xl font-bold mb-3 ${value.color} group-hover:${value.color}`}
                  >
                    {value.title}
                  </h3>
                  <p className="text-gray-700">{value.description}</p>
                  <div
                    className={`h-0.5 bg-gradient-to-r ${
                      hoveredCard === `value-${index}`
                        ? "from-blue-400 to-purple-600 w-full"
                        : "from-transparent to-transparent w-0"
                    } mt-6 transition-all duration-500`}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Section */}
        {activeTab === "history" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Our Journey</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto"></div>
              <p className="text-xl text-gray-600 mt-6 max-w-2xl mx-auto">
                Milestones that shaped our company's growth and success
              </p>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-black md:left-1/2 md:-ml-0.5"></div>

              {[
                {
                  year: "2015",
                  title: "Company Founded",
                  description:
                    "Started in a small garage with just 3 people and a big vision for the future of technology.",
                },
                {
                  year: "2017",
                  title: "First Product Launch",
                  description:
                    "Released our inaugural product that revolutionized the industry standard.",
                },
                {
                  year: "2019",
                  title: "Series B Funding",
                  description:
                    "Secured $50M in funding to expand our research and development capabilities.",
                },
                {
                  year: "2021",
                  title: "Global Expansion",
                  description:
                    "Opened offices in 3 continents, serving customers in over 50 countries.",
                },
                {
                  year: "2023",
                  title: "Sustainability Pledge",
                  description:
                    "Committed to carbon neutrality by 2025 across all operations.",
                },
              ].map((milestone, index) => (
                <div
                  key={index}
                  className={`relative mb-16 pl-16 md:pl-0 md:flex ${
                    index % 2 === 0 ? "md:justify-start" : "md:justify-end"
                  }`}
                >
                  <div
                    className={`md:w-5/12 ${
                      index % 2 === 0 ? "md:pr-8" : "md:pl-8"
                    }`}
                  >
                    <div
                      className={`absolute left-0 w-16 h-16 rounded-full bg-black flex items-center justify-center text-white font-bold md:left-1/2 md:-ml-8 transition-all duration-300 shadow-lg ${
                        hoveredCard === `milestone-${index}`
                          ? "ring-4 ring-black scale-110"
                          : ""
                      }`}
                      onMouseEnter={() => setHoveredCard(`milestone-${index}`)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      {milestone.year}
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
                      <h3 className="text-xl font-bold mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Online Shopping Store" && (
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                About Online Shopping Store
              </h2>
              <div className="w-24 h-1 bg-black mx-auto mb-6"></div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Shaping Australia's digital future through innovation and
                accessibility
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                  Our Vision & Mission
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Online Shopping Store is a dynamic and forward-thinking
                  company committed to building a clothing ecosystem in
                  Australia. Our mission is to bridge the gap between innovation
                  and accessibility, providing seamless digital solutions across
                  multiple clothing industries.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Driven by innovation and customer satisfaction, Industries
                  Online Shopping Store is dedicated to shaping the future of
                  digital services in Australia. Our commitment to quality,
                  efficiency, and customer trust fuels our growth as we continue
                  expanding our vision.
                </p>
              </div>
              <div className="bg-black p-8 rounded-xl shadow-sm border border-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
                  alt="Online Shopping Store"
                  className="rounded-lg shadow-md w-full h-auto"
                />
              </div>
            </div>

            <div className="mb-16">
              <h3 className="text-2xl font-semibold text-center text-gray-800 mb-12">
                Our Ecosystem
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    name: "Online Shopping Store",
                    description:
                      "Your go-to online marketplace for the latest tech products",
                    icon: "💻",
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                  },
                  {
                    name: "Online Shopping Store",
                    description: "Simplifying real estate and rental services",
                    icon: "🏠",
                    color: "text-purple-600",
                    bg: "bg-purple-50",
                  },
                  {
                    name: "Online Shopping Store",
                    description: "Elevating the hospitality experience",
                    icon: "🏨",
                    color: "text-green-600",
                    bg: "bg-green-50",
                  },
                  {
                    name: "Online Shopping Store",
                    description: "Making travel easier and more accessible",
                    icon: "✈️",
                    color: "text-orange-600",
                    bg: "bg-orange-50",
                  },
                ].map((service, index) => (
                  <div
                    key={index}
                    className={`${service.bg} p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-2`}
                  >
                    <div className={`text-4xl mb-4 ${service.color}`}>
                      {service.icon}
                    </div>
                    <h4 className="text-xl font-semibold mb-2 text-gray-800">
                      {service.name}
                    </h4>
                    <p className="text-gray-600">{service.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to experience the future?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
            Join thousands of satisfied customers who trust our innovative
            solutions.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/contact">
              <button className="px-8 py-4 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer">
                Contact Sales
              </button>
            </Link>
            <Link to="/products">
              <button className="px-8 py-4 border border-white/30 rounded-full font-medium hover:bg-white/10 transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer">
                Explore Products
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
