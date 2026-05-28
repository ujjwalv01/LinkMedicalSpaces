'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const testimonials = [
  {
    quote: "I had a fantastic experience working with Link Medical Spaces to find a medical office space to lease. From the start, their team was attentive, knowledgeable, and genuinely invested in understanding my needs. They made the entire process smooth and stress-free — handling every detail with professionalism and care. Thanks to their expertise, I found the perfect office space that meets all my requirements. I highly recommend Link Medical Spaces to anyone looking for medical office leasing solutions!",
    name: "Jamie Martinez",
    title: "Practice Manager"
  },
  {
    quote: "Link Medical Spaces made it easy for me to find and sublease medical office space. The website is simple to use and made for doctors and healthcare providers. I could quickly list my space and talk to people who were interested. The listings had clear details like size, price, and what equipment was included. This saved me time and stress compared to using a regular broker. The support team was friendly and quick to help when I had questions. I would definitely recommend Link Medical Spaces to anyone in healthcare who wants to rent out or find office space.",
    name: "Dr Khubchandani",
    title: ""
  },
  {
    quote: "Dr. Mitra and I \"knew\" each other virtually through shared circles. However, our connection became flesh and blood \"real\" when we made a decision to sublease our brick and mortar office. From the moment we listed, she checked in with us periodically, and came by (with treats) to meet, chat, and view the office. Absolutely love the authenticity with which she runs her business!",
    name: "Dr Heather Stanley-Christian",
    title: ""
  }
]

export default function TestimonialSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-slide every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  return (
    <section className="py-20 bg-slate-100/60 overflow-hidden relative border-y border-slate-200/50">
      <div className="max-w-4xl mx-auto px-6 relative">
        <div className="text-center mb-10">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-teal-600 mb-3">
            What healthcare professionals are saying
          </p>
          <h2 className="text-3xl sm:text-4xl font-light text-slate-800 tracking-tight">
            Real Stories. Real Results.
          </h2>
        </div>

        <div className="relative min-h-[250px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center px-8 sm:px-12 w-full absolute"
            >
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
                {testimonials[currentIndex].quote}
              </p>
              <div className="mt-8">
                <p className="text-sm font-bold text-slate-800">{testimonials[currentIndex].name}</p>
                {testimonials[currentIndex].title && (
                  <p className="text-xs font-semibold text-teal-600 mt-1">{testimonials[currentIndex].title}</p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <button 
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-600 transition-colors z-10"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-8 h-8" strokeWidth={1.5} />
          </button>
          
          <button 
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-600 transition-colors z-10"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-8 h-8" strokeWidth={1.5} />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center items-center gap-2 mt-8">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'bg-slate-800 w-3' : 'bg-slate-300'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
