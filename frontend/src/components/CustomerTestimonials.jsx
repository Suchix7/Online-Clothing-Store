import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState, useRef } from "react";
import { axiosInstance } from "../lib/axiosInstance.js";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

function Modal({ isOpen, onClose, children, modalRef }) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center px-4">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl p-6 w-full max-w-lg relative shadow-xl"
      >
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

const CustomerTestimonials = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    containScroll: "trimSnaps",
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [expandedId, setExpandedId] = useState(null); // NEW: track which card is expanded
  const [formData, setFormData] = useState({
    name: "",
    experience: "",
    location: "",
    image: null,
  });
  const modalRef = useRef();

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await axiosInstance.get("/show-testimonials");
        setTestimonials(response.data);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
        toast.error("Failed to load testimonials. Please try again later.");
        setTestimonials([]);
      }
    };

    fetchTestimonials();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsModalOpen(false);
      }
    }

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi]
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log("Submitting testimonial:", formData);
    try {
      const res = await axiosInstance.post("/testimonial", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Testimonial submitted successfully!");
      setFormData({ name: "", experience: "", location: "", image: null });
      setIsSubmitting(false);
      setIsModalOpen(false);
    } catch (error) {
      console.log("Error submitting testimonial:", error);
      toast.error("Failed to submit testimonial. Please try again.");
      setIsSubmitting(false);
      setIsModalOpen(false);
    }
  };

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  if (testimonials.length === 0) {
    return (
      <section className="bg-white py-20 px-4 md:px-12 lg:px-40 mt-6">
        <h1>No Testimonials</h1>
      </section>
    );
  }

  return (
    <section className="bg-white py-20 px-4 md:px-12 lg:px-40 mt-6">
      <div className="max-w-full">
        <div className="text-center mb-5">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            See what our customers have to say about their experience with our
            platform
          </p>
        </div>
        <div className="md:flex justify-end gap-1 hidden">
          {/* Navigation */}
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className=" bg-black text-white p-3 rounded-full shadow-lg hover:translate-x-[-2px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed z-10 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className=" bg-black text-white p-3 rounded-full shadow-lg hover:translate-x-[2px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed z-10 cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="relative cursor-pointer">
          <div className="pointer-events-none absolute top-0 left-0 h-full w-10 bg-gradient-to-r from-white to-transparent z-10 rounded-r-2xl hidden md:block" />
          <div className="pointer-events-none absolute top-0 right-0 h-full w-10 bg-gradient-to-l from-white to-transparent z-10 rounded-l-2xl hidden md:block" />
          <div className="overflow-hidden pt-6" ref={emblaRef}>
            <div className="flex touch-pan-y will-change-transform">
              {testimonials.length > 0 &&
                testimonials.map((testimonial) => (
                  <div
                    key={testimonial._id}
                    className="flex-[0_0_100%] md:flex-[0_0_33.33%] lg:flex-[0_0_25%] px-2"
                  >
                    <div
                      onClick={() =>
                        setExpandedId((prev) =>
                          prev === testimonial._id ? null : testimonial._id
                        )
                      }
                      role="button"
                      aria-expanded={expandedId === testimonial._id}
                      className="group bg-white rounded-2xl shadow-md overflow-hidden flex flex-col justify-between h-full transition-all duration-300 hover:-translate-y-5 hover:shadow-lg cursor-pointer"
                    >
                      {/* Image + overlayed review */}
                      <div
                        className="relative h-120 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${
                            testimonial?.image?.url || "/placeholder.png"
                          })`,
                        }}
                      >
                        <div className="absolute top-2 left-2 bg-white text-sm text-gray-800 px-3 py-1 rounded-full shadow">
                          {testimonial.name}
                        </div>

                        <div className="absolute bottom-0 left-0 w-full bg-black/70 text-white p-4">
                          <p
                            className={`text-sm transition-all duration-200 ${
                              expandedId === testimonial._id
                                ? ""
                                : "line-clamp-4 group-hover:line-clamp-none"
                            }`}
                          >
                            {testimonial.experience}
                          </p>
                        </div>
                      </div>

                      {/* Star rating + product info (kept commented as in your original) */}
                      {/*
                      <div className="p-4 border-t">
                        <div className="flex items-center mb-2 text-sm text-gray-600">
                          <span className="text-yellow-500">★★★★★</span>
                          <span className="ml-2">5/5</span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <img
                            src={
                              testimonial.productThumbnail || "/placeholder.png"
                            }
                            alt="Product"
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div className="text-sm">
                            <div className="font-medium text-gray-800">
                              {testimonial.productName || "Product Name"}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {testimonial.productSpecs ||
                                "Specs or short detail"}
                            </div>
                          </div>
                        </div>
                      </div>
                      */}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center space-x-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi && emblaApi.scrollTo(index)}
              className={`h-2 rounded-full transition-all duration-200 ${
                index === selectedIndex
                  ? "bg-black w-8"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <p className="text-gray-500 mb-6">
            Join thousands of satisfied customers
          </p>
          <button
            className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:shadow-2xl hover:translate-y-[-5px] cursor-pointer transition-all duration-200"
            onClick={() => setIsModalOpen(true)}
          >
            Write about your experience
          </button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalRef={modalRef}
      >
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center px-4">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl p-6 w-full max-w-lg relative shadow-xl"
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Share Your Experience
            </h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Experience
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                  rows={4}
                  value={formData.experience}
                  onChange={(e) =>
                    setFormData({ ...formData, experience: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.files[0] })
                  }
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-black text-white px-6 py-2 rounded-lg hover:shadow-md transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default CustomerTestimonials;
