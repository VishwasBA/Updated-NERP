import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const slides = [
  {
    image: "/nexer-hero-2.png",
    alt: "Nexer employee laughing in front of a graffiti wall",
  },
  {
    image: "/nexer-hero-3.png",
    alt: "Nexer colleagues collaborating around a laptop",
  },
  {
    image: "/nexer-hero-4.png",
    alt: "Nexer team member smiling in a workshop meeting",
  },
  {
    image: "/nexer-hero-5.png",
    alt: "Nexer colleagues working with a robotics arm",
  },
  {
    image: "/nexer-hero-6.png",
    alt: "Nexer employee working from a couch at home",
  },
];

export default function HeroCarousel() {
  const [api, setApi] = useState<CarouselApi | undefined>(undefined);
  const [current, setCurrent] = useState(0);

  // Track current slide
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);

    // Set initial slide
    onSelect();

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Auto-play
  useEffect(() => {
    if (!api || slides.length <= 1) return;

    const interval = window.setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [api]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-[24px] border border-border shadow-card"
    >
      <Carousel
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {slides.map((slide, index) => (
            <CarouselItem
              key={index}
              className="pl-0"
            >
              <div className="relative aspect-[21/9] w-full sm:aspect-[2/1]">
                <img
                  src={slide.image}
                  alt={slide.alt}
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Pagination */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => api?.scrollTo(index)}
              className={`transition-all duration-300 rounded-full ${
                current === index
                  ? "h-2 w-8 bg-white"
                  : "h-2 w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}