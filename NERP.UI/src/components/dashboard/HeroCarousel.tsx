import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

// Real brand imagery already shipped with the app (public/nexer.png). Only
// one banner photo currently exists, so the carousel renders a single real
// slide rather than padding the deck with placeholder images — add more
// files here as real assets become available.
const slides = [{ image: "/nexer.png", alt: "Nexer team collaborating" }];

export default function HeroCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    onSelect();
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || slides.length < 2) return;
    const id = setInterval(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, 5000);
    return () => clearInterval(id);
  }, [api]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950"
    >
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent className="-ml-0">
          {slides.map((slide, i) => (
            <CarouselItem key={i} className="pl-0">
              <div className="relative aspect-[21/9] w-full sm:aspect-[3/1]">
                <img src={slide.image} alt={slide.alt} className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                current === i ? "w-5 bg-blue-600" : "w-1.5 bg-slate-300 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
