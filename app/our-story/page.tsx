'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-6 py-16 md:py-24 flex flex-col lg:flex-row gap-12 lg:gap-16">
        
        {/* Left Side Content */}
        <div className="flex-1 space-y-4 text-[#6B7280] text-[17px] leading-relaxed">
          <h1 className="text-4xl md:text-[42px] font-extrabold text-[#000080] leading-[1.2] mb-6">
            Empowering Healthcare Innovation
          </h1>
          
          <p>
            Hi, I'm Dr Mitra- physician mom and lean private practice nephrologist.
          </p>
          
          <p>
            Why do I work for myself? So I don't have to take anyone's permission for vacation! (I'm only partly kidding).
          </p>
          
          <p>
            But running a practice in this day and age of falling reimbursements and rising cost of doing business is HARD. The only way I knew how to pull it off was to run my practice really lean.
          </p>
          
          <p>
            I focused on office space because that is the biggest expense for a startup practice. I wanted to sublet a little bit of space from another practice but there was no easy way to do it. I cold called a few practices and got nothing but a string of polite no's.
          </p>
          
          <p>
            And that is what planted the seed for Link Medical Spaces: a peer-to-peer platform that directly connects healthcare professionals with medical office space to lease or sublease- think Airbnb or Turo, but for medical offices- so practices can earn passive income or lease only what they need and run leaner, more sustainable practices.
          </p>
          
          <p>
            So your practice can support the mission you started it for in the first place.
          </p>
          
          <p>
            Because Link Medical Spaces is more than about finding the right office space- it's about empowering private practices to thrive in today's challenging healthcare landscape.
          </p>
        </div>

        {/* Right Side Image */}
        <div className="w-full lg:w-[320px] shrink-0 mx-auto lg:mx-0 flex flex-col items-center lg:items-start pt-4 lg:pt-0">
          <div className="w-full relative bg-slate-100 mb-4">
            <img 
              src="/Dr. mitra.jpg" 
              alt="Dr Mitra, Founder Link Medical Spaces" 
              className="w-full h-auto object-cover border border-slate-100"
            />
          </div>
          <p className="text-[13px] italic text-slate-500 font-medium w-full text-left">
            Dr Mitra, Founder Link Medical Spaces
          </p>
        </div>
        
      </main>

      <Footer />
    </div>
  )
}
