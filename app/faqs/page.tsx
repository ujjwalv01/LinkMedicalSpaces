'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function FaqsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      q: 'What is Link Medical Spaces?',
      a: (
        <p>
          An online marketplace where you can list any available space in your medical office for other physicians or healthcare workers to sublet or lease.
        </p>
      )
    },
    {
      q: 'Who should list on Link Medical Spaces?',
      a: (
        <div className="space-y-4">
          <p>
            Do you have space in your medical office that you’re not using, whether all the time or some of the time? Then use that to help someone and generate revenue as well! You choose how much of your office will be available and when. It could be as little as half a day a week all the way to full-time.
          </p>
          <p>
            Are you in the operating room on Mondays and Wednesdays and your office space is lying unused? Or maybe you are doing a satellite clinic on Fridays and have your office sitting empty? Sublet the space to someone and let it be put to good use.
          </p>
          <p>
            Maybe you have 5 exam rooms while you need only 3 for your own use. Share the space and both of you benefit. Or maybe you have a completely unused medical office space that you are looking to lease.
          </p>
          <p>
            Link Medical Spaces puts your medical office space right in front of the people who will use it. Physicians and other healthcare workers.
          </p>
        </div>
      )
    },
    {
      q: 'Who would use a shared medical office space?',
      a: (
        <div className="space-y-2">
          <p>Anyone actually.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>A DPC practice.</li>
            <li>A lean private practice. That is, a practice which focuses on creating the greatest value for its patients with fewer resources and less waste.</li>
            <li>A physician starting out a private practice and still building up volume.</li>
            <li>A physician choosing to work time and would save considerable expense not leasing an office full-time.</li>
            <li>An established practice opening up a satellite location with part-time presence in the new area.</li>
          </ul>
        </div>
      )
    },
    {
      q: 'How do you work in a shared medical space?',
      a: (
        <div className="space-y-4">
          <p>
            Shared workspaces have been popular for quite some time in other fields. Healthcare has been slow on this update, for fairly obvious reasons. But, more and more, we hear of folks doing this in medicine. And it can be done right and be a win-win situation. If you are subletting your office when it is not in use, that makes it really simple. But even if you are using the office at the same time as your lessee is, you can certainly make it work. Think through whether your waiting room can accommodate a few more patients and how your workflow will mesh with your lessee’s.
          </p>
          <p>
            If they have a staff member or two who accompany them, is there room for them to work? and last but not least, take care of HIPAA considerations- talk to your attorney to address any questions.
          </p>
        </div>
      )
    },
    {
      q: 'How does Link Medical Spaces work?',
      a: (
        <p>
          It’s simple. If you’re looking for available medical office space, go right ahead to browse the website and see what is available in your neck of the woods. If you have medical office space to lease out or sublet, create a free account and post it in a matter of minutes by answering a few questions about your space. We charge you a nominal fee to do so.
        </p>
      )
    },
    {
      q: 'How do you decide on rent?',
      a: (
        <div className="space-y-4">
          <p>
            Rent depends on many factors- including your cost for the space, demand and supply and other unique features that make your space especially attractive to a tenant. Look up comparable listings online to give you an idea of price per square footage in your area. How do you come up with your cost for the space? You know how much monthly rent/ mortgage you pay for your space. Add in utilities, cleaning fees, internet access, etc. That’s your total number.
          </p>
          <p>
            If you want to sublet your space only part-time, divide up the work-week into 10 half-days (Monday through Friday). And then fractionate the rent accordingly, based on number of half-days the space will be leased.
          </p>
        </div>
      )
    },
    {
      q: 'Is the rent negotiable?',
      a: (
        <p>
          We don’t get involved with your negotiation! We just bring both parties to the table.
        </p>
      )
    },
    {
      q: 'What if there is no listing in my area?',
      a: (
        <p>
          New listings come up on the website all the time! <Link href="/signup" className="text-blue-600 hover:underline">Sign up for email alerts here</Link> so you can stay on top of it.
        </p>
      )
    }
  ]

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1a2b49] mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-slate-500">Everything you need to know about Link Medical Spaces.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index

            return (
              <div 
                key={index} 
                className={`bg-white border rounded-2xl overflow-hidden transition-colors duration-200 ${isOpen ? 'border-slate-300 shadow-md' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <span className="text-lg font-bold text-slate-900 pr-8">
                    {faq.q}
                  </span>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${isOpen ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-2 text-black leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </main>

      <Footer />
    </div>
  )
}
