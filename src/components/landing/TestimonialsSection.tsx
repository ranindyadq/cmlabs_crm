// components/landing/TestimonialsSection.tsx

"use client"; 
import { motion } from 'framer-motion';
import { Star } from 'lucide-react'; 

// Definisikan data testimoni
const testimonials = [
  {
    quote: "This CRM changed how we work. Everything is more organized, and our sales increased by 20%!",
    name: "Budi Setiawan",
    title: "CEO, Maju Jaya Tech",
  },
  {
    quote: "It's so intuitive and easy to use. My team was able to adopt it immediately without days of training.",
    name: "Citra Lestari",
    title: "Sales Manager, Sinar Abadi",
  },
  {
    quote: "The analytics reports are a game-changer for making data-driven decisions. Highly recommended!",
    name: "Doni Prasetyo",
    title: "Owner, Kopi Kenangan",
  },
];

// Komponen helper untuk Bintang Peringkat
const StarRating = () => (
  <div className="flex mb-4">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" />
    ))}
  </div>
);

export default function TestimonialsSection() {
  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4 text-text-strong">
          What Our <span className="text-primary">Customers</span> Say
        </h2>
        <p className="text-center mb-12 max-w-xl mx-auto">
          Real stories from real <span className="text-primary font-medium">teams</span> who 
          are already <span className="text-primary font-medium">winning</span> with our CRM.
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              whileHover={{ 
                y: -5, 
                boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)", 
                transition: { duration: 0.2 } 
              }}
              className="bg-card p-6 rounded-xl shadow-lg border border-border"
            >
              <StarRating />
              <p className="italic mb-6">
                {testimonial.quote}
              </p>
              <div className="flex items-center">
                
                {/* INI PERUBAHANNYA: Avatar dengan Inisial */}
                <div className="w-12 h-12 rounded-full bg-primary mr-4 flex-shrink-0 flex items-center justify-center">
                  <span className="text-lg font-semibold text-white">
                    {/* Mengambil huruf pertama dari nama */}
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                
                <div>
                  <p className="font-semibold text-text-strong">{testimonial.name}</p>
                  <p className="text-sm">{testimonial.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
          
        </div>
      </div>
    </section>
  );
}