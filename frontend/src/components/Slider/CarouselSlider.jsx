import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./CarouselSlider.css";
import ProfessorCard from "./ProfessorCard"; // Added import
import NoticeBoard from "./NoticeBoard"; // Added import

// Import your images
import i001 from "/img1.jpg";
import i002 from "/img2.jpg";
import i2 from "/VC.jpg";
import i003 from "/img3.jpg";
import i004 from "/img4.jpg";
import i005 from "/Img5.jpg";
import i006 from "/Img6.jpg";
import i007 from "/C1.jpeg";
import i008 from "/C2.jpg";
import i009 from "/C3.jpeg";
import i010 from "/C4.jpeg";
import i011 from "/C5.jpeg";
import i012 from "/C6.jpeg";
import i013 from "/C7.jpeg";
import i014 from "/C8.jpeg";
import i015 from "/C9.jpeg";
import i016 from "/C10.jpeg";
import i017 from "/C11.jpeg";
import i018 from "/C12.jpeg";
import i019 from "/C13.jpeg";
import i020 from "/C14.jpeg";
import i021 from "/C15.jpeg";
import i022 from "/C16.jpeg";
import i023 from "/C17.jpeg";
import i024 from "/C18.jpeg";
import i025 from "/C19.jpeg";

const images = [
  // { src: i001, alt: "Image 1" },
  // { src: i002, alt: "Image 2" },
  // { src: i003, alt: "Image 3" },
  // { src: i004, alt: "Image 4" },
  // { src: i005, alt: "Image 5" },
  // { src: i006, alt: "Image 6" },
  { src: i007, alt: "Image 7" },
  { src: i008, alt: "Image 8" },
  { src: i009, alt: "Image 9" },
  { src: i010, alt: "Image 10" },
  { src: i011, alt: "Image 11" },
  { src: i012, alt: "Image 12" },
  { src: i013, alt: "Image 13" },
  { src: i014, alt: "Image 14" },
  { src: i015, alt: "Image 15" },
  { src: i016, alt: "Image 16" },
  { src: i017, alt: "Image 17" },
  { src: i018, alt: "Image 18" },
  { src: i019, alt: "Image 19" },
  { src: i020, alt: "Image 20" },
  { src: i021, alt: "Image 21" },
  { src: i022, alt: "Image 22" },
  { src: i023, alt: "Image 23" },
  { src: i024, alt: "Image 24" },
  { src: i025, alt: "Image 25" },
];

// Placeholder data for professors - IMPORTANT: Replace imgSrc with actual image paths
const professors = [
  {
    name: "Prof. Jai Prakash Saini",
    title: "Vice-Chancellor, University of Lucknow",
    imgSrc: i2,
    email: "vc@lko.ac.in",
  },
  {
    name: "Prof. Amita Kanaujia",
    title: "Dean Students' Welfare, University of Lucknow",
    imgSrc: i001,
    email: "dsw@lko.ac.in",
  },
];

const CarouselSlider = () => {
  return (
    <div className="w-full py-4 lg:py-12 bg-gray-50">
      <div className="container mx-auto px-4 lg:px-18 max-w-full">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {" "}
          {/* Left Column: Professor Cards */}
          <div className="w-full lg:w-3/12 xl:w-2/12 flex flex-col lg:flex-col space-y-4 lg:space-y-12">
            {professors.map((prof) => (
              <ProfessorCard
                className="object-cover"
                key={prof.name}
                name={prof.name}
                title={prof.title}
                imgSrc={prof.imgSrc}
                email={prof.email}
              />
            ))}
          </div>
          {/* Center Column: Swiper */}
          <div className="w-full lg:w-6/12 xl:w-8/12">
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              loop={true}
              className="rounded-lg shadow-xl h-[400px] lg:h-[500px] xl:h-[550px]"
            >
              {images.map((img, idx) => (
                <SwiperSlide key={idx}>
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover rounded-lg shadow-md"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          {/* Right Column: Notice Board */}
          <div className="w-full lg:w-3/12 xl:w-2/12">
            <div className="h-[400px] lg:h-[500px] xl:h-[550px] overflow-hidden">
              <NoticeBoard />
            </div>
          </div>
        </div>
      </div>{" "}
      {/* Marquee Section (Welcome Text) - Kept below the 3-column layout */}
      <div className="mt-8 bg-gray-100 text-white py-4 px-2 text-center">
        <h1 className="text-3xl font-bold mb-4 text-black">
          Welcome to the Hostel Management System
        </h1>
        <p className="text-lg max-w-full mx-auto text-gray-800">
          The official platform for managing hostel accommodations, facilities,
          and services at the University of Lucknow. Explore our hostels, access
          online services, and stay updated with the latest information.
        </p>
      </div>
    </div>
  );
};

export default CarouselSlider;
