"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { axiosInstance } from "../lib/axiosInstance.js";
import toast from "react-hot-toast";
// Lucide React icons (imported individually for clarity)
import {
  BadgeDollarSign,
  BarChart3,
  CalendarCheck,
  Lightbulb,
  ChevronRight,
  MapPin,
  Clock,
  Briefcase,
  Upload,
  CheckCircle,
} from "lucide-react";
import Navbar from "../components/Navbar";

const CareersPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState("");

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    linkedin: "",
    coverLetter: "",
    hearAbout: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Append all fields
      for (const key in data) {
        formData.append(key, data[key]);
      }
      formData.append("resume", resumeFile); // Important: 'resume' matches field name in multer

      const response = await axiosInstance.post("/apply", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(response.data.message);
    } catch (error) {
      toast.error("Error submitting application. Please try again.");
      console.log("Error submitting application:", error);
      setIsSubmitting(true);
      setIsSubmitted(false);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handlePositionSelect = (position) => {
    setSelectedPosition(position);
    // Scroll to form section
    document
      .getElementById("application-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative w-full h-[70vh] lg:h-[100vh] flex items-center justify-center overflow-hidden bg-black text-white"
      >
        <div className="absolute inset-0 opacity-80">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute w-full h-full object-cover"
          >
            <source src="/join.mp4" type="video/mp4" />
          </video>
        </div>
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 container mx-auto px-4 md:px-6 text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
            Join Our Team
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 text-gray-200">
            Be part of something extraordinary. Create the future with us.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              document
                .getElementById("open-positions")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="inline-flex items-center px-6 py-3 bg-transparent border border-white hover:bg-white hover:text-black transition-colors duration-300"
          >
            View Open Positions
            <ChevronRight className="ml-2 h-4 w-4" />
          </motion.button>
        </motion.div>
      </motion.section>

      {/* Open Positions Section */}
      <motion.section
        id="open-positions"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
        className="py-16 bg-white"
      >
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12 text-center">
            Open Positions
          </h2>

          {careers.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {careers.map((career, index) => (
                <motion.div
                  key={index}
                  variants={fadeIn}
                  className="border border-gray-200 p-6 bg-white hover:shadow-lg transition-shadow duration-300"
                >
                  <h3 className="text-xl font-bold mb-3">{career.title}</h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">{career.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-2">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm">{career.type}</span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-4">
                    <Briefcase className="h-4 w-4 mr-2" />
                    <span className="text-sm">{career.department}</span>
                  </div>
                  <p className="text-gray-700 mb-6">{career.description}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePositionSelect(career.title)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium border border-black hover:bg-black hover:text-white transition-colors duration-300"
                  >
                    Apply Now
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center h-[40vh] flex justify-center items-center text-gray-600 text-lg mt-12">
              There are currently no open positions. Please check back later.
            </div>
          )}
        </div>
      </motion.section>

      {/* Benefits Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
        className="relative py-28 text-white overflow-hidden"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/joinus.jpg"
            alt="Team working together"
            className="w-full h-full object-cover brightness-[0.6]"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 md:px-8">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-16 text-center text-white drop-shadow-md">
            Why Join Us
          </h2>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                variants={fadeIn}
                className="flex flex-col items-start p-6 bg-white/10 border border-white/20 backdrop-blur-lg rounded-2xl shadow-lg transform transition-all duration-300 ease-in-out hover:-translate-y-2 hover:bg-purple-500/20 hover:border-purple-400 hover:shadow-2xl"
              >
                <div className="mb-5 text-white transition-colors duration-300 ease-in-out">
                  <benefit.icon className="h-9 w-9" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 transition-colors duration-300 ease-in-out">
                  {benefit.title}
                </h3>
                <p className="text-white text-sm leading-relaxed transition-colors duration-300 ease-in-out">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Application Form Section */}
      <motion.section
        id="application-form"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
        className="py-16 bg-white"
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-center">
              Apply Now
            </h2>
            <p className="text-center text-gray-600 mb-12">
              Take the first step towards your next career opportunity. Fill out
              the form below and we'll be in touch.
            </p>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-12 border border-gray-200 rounded-lg"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black text-white mb-6">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  Application Submitted
                </h3>
                <p className="text-gray-600 mb-8">
                  Thank you for your interest in joining our team. We'll review
                  your application and get back to you soon.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsSubmitted(false);
                    setSelectedPosition("");
                    setResumeFile(null);
                  }}
                  className="px-6 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors duration-300"
                >
                  Submit Another Application
                </motion.button>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                onSubmit={handleSubmit}
                className="space-y-8 border border-gray-200 p-8 rounded-lg"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium"
                    >
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      value={data.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium"
                    >
                      Last Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      value={data.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium">
                    Email<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium">
                    Phone Number<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={data.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="position"
                    className="block text-sm font-medium"
                  >
                    Position <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="position"
                    name="position"
                    value={data.position}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  >
                    <option value="" disabled>
                      Select a position
                    </option>
                    {careers.map((career, index) => (
                      <option key={index} value={career.title}>
                        {career.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="resume" className="block text-sm font-medium">
                    Resume/CV <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="resume"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-black"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3" />
                        {resumeFile ? (
                          <p className="text-sm">{resumeFile.name}</p>
                        ) : (
                          <>
                            <p className="mb-2 text-sm font-semibold">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, DOCX or RTF (MAX. 5MB)
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        id="resume"
                        type="file"
                        accept=".pdf,.docx,.rtf"
                        className="hidden"
                        onChange={handleFileChange}
                        required
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="linkedin"
                    className="block text-sm font-medium"
                  >
                    LinkedIn Profile (Optional)
                  </label>
                  <input
                    id="linkedin"
                    type="url"
                    name="linkedin"
                    value={data.linkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="coverLetter"
                    className="block text-sm font-medium"
                  >
                    Cover Letter <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="coverLetter"
                    name="coverLetter"
                    value={data.coverLetter}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Tell us why you're interested in this position and what you can bring to our team..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black resize-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="hearAbout"
                    className="block text-sm font-medium"
                  >
                    How did you hear about us?
                  </label>
                  <select
                    id="hearAbout"
                    name="hearAbout"
                    value={data.hearAbout}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  >
                    <option value="" disabled selected>
                      Select an option
                    </option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="indeed">Indeed</option>
                    <option value="glassdoor">Glassdoor</option>
                    <option value="referral">Employee Referral</option>
                    <option value="website">Company Website</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-black text-white hover:bg-gray-800 transition-colors duration-300 disabled:opacity-70"
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </motion.button>
              </motion.form>
            )}
          </div>
        </div>
      </motion.section>
    </div>
  );
};

// Sample career data
const careers = [
  // {
  //   title: "Senior Software Engineer",
  //   location: "San Francisco, CA",
  //   type: "Full-time",
  //   department: "Engineering",
  //   description:
  //     "We're looking for a Senior Software Engineer to help build and scale our core platform. You'll work on challenging problems and help shape the future of our technology.",
  // },
  // {
  //   title: "Product Designer",
  //   location: "New York, NY",
  //   type: "Full-time",
  //   department: "Design",
  //   description:
  //     "Join our design team to create beautiful, intuitive experiences that delight our users. You'll collaborate with cross-functional teams to bring products from concept to launch.",
  // },
  // {
  //   title: "Marketing Manager",
  //   location: "Remote",
  //   type: "Full-time",
  //   department: "Marketing",
  //   description:
  //     "Drive our marketing strategy and help us reach new audiences. You'll lead campaigns, analyze performance, and find innovative ways to tell our story.",
  // },
  // {
  //   title: "Data Scientist",
  //   location: "Boston, MA",
  //   type: "Full-time",
  //   department: "Data",
  //   description:
  //     "Turn data into insights that drive business decisions. You'll work with large datasets to uncover patterns, build models, and help us make data-driven decisions.",
  // },
  // {
  //   title: "Customer Success Manager",
  //   location: "Chicago, IL",
  //   type: "Full-time",
  //   department: "Customer Success",
  //   description:
  //     "Be the voice of our customers and ensure they get maximum value from our products. You'll build relationships, provide support, and drive customer satisfaction.",
  // },
  // {
  //   title: "DevOps Engineer",
  //   location: "Seattle, WA",
  //   type: "Full-time",
  //   department: "Engineering",
  //   description:
  //     "Help us build and maintain our infrastructure. You'll work on automation, deployment, monitoring, and ensuring our systems are reliable and scalable.",
  // },
];

// Benefits data
const benefits = [
  {
    title: "Competitive Compensation",
    description:
      "We offer competitive salaries along with performance-based bonuses, equity options, and comprehensive benefits packages that reflect the value you bring to the team. Your success is our success, and we reward it accordingly.",
    icon: BadgeDollarSign,
  },
  {
    title: "Professional Growth",
    description:
      "We’re deeply invested in your growth. From mentorship programs and sponsored certifications to internal mobility and leadership training, we provide clear career pathways and continuous learning opportunities to help you thrive.",
    icon: BarChart3,
  },
  {
    title: "Work-Life Balance",
    description:
      "We believe great work comes from happy, rested people. Enjoy flexible schedules, remote-friendly policies, generous PTO, and wellness days so you can recharge, spend time with loved ones, and prioritize what matters most.",
    icon: CalendarCheck,
  },
  {
    title: "Innovative Environment",
    description:
      "Be part of a culture that encourages experimentation, creativity, and forward-thinking. You'll work on meaningful, high-impact projects using modern tools and technologies, surrounded by passionate teammates who challenge the status quo.",
    icon: Lightbulb,
  },
];

export default CareersPage;
