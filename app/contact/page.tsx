'use client'

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate an API call
    setTimeout(() => {
      setIsSubmitting(false)
      setSuccess(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col items-center">
        {/* Page Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800">
            Contact Us
          </h1>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12 w-full">
          <p className="text-slate-600 text-base mb-8 leading-relaxed">
            You can email us at{' '}
            <a href="mailto:hello@linkmedicalspaces.com" className="text-teal-600 hover:text-teal-700 font-semibold transition-colors">
              hello@linkmedicalspaces.com
            </a>{' '}
            or use the contact form below, and we'll get back to you within 2 working days.
          </p>

          {success && (
            <div className="mb-8 p-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-sm font-medium">
              Thank you! Your message has been sent successfully. We will be in touch soon.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="sr-only">Name</label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder=""
                  className="w-full bg-transparent border border-slate-300 hover:border-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-md px-4 py-3 text-slate-800 outline-none transition-all peer"
                />
                {!formData.name && (
                  <span className="absolute inset-y-0 left-4 flex items-center text-slate-500 pointer-events-none peer-focus:opacity-30">
                    Name <span className="text-red-500 ml-1">*</span>
                  </span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder=""
                  className="w-full bg-transparent border border-slate-300 hover:border-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-md px-4 py-3 text-slate-800 outline-none transition-all peer"
                />
                {!formData.email && (
                  <span className="absolute inset-y-0 left-4 flex items-center text-slate-500 pointer-events-none peer-focus:opacity-30">
                    Email <span className="text-red-500 ml-1">*</span>
                  </span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="sr-only">Phone</label>
              <div className="relative">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder=""
                  className="w-full bg-transparent border border-slate-300 hover:border-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-md px-4 py-3 text-slate-800 outline-none transition-all peer"
                />
                {!formData.phone && (
                  <span className="absolute inset-y-0 left-4 flex items-center text-slate-500 pointer-events-none peer-focus:opacity-30">
                    Phone <span className="text-red-500 ml-1">*</span>
                  </span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="sr-only">Subject</label>
              <div className="relative">
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder=""
                  className="w-full bg-transparent border border-slate-300 hover:border-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-md px-4 py-3 text-slate-800 outline-none transition-all peer"
                />
                {!formData.subject && (
                  <span className="absolute inset-y-0 left-4 flex items-center text-slate-500 pointer-events-none peer-focus:opacity-30">
                    Subject <span className="text-red-500 ml-1">*</span>
                  </span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="message" className="sr-only">Message</label>
              <div className="relative">
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder=""
                  className="w-full bg-transparent border border-slate-300 hover:border-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-md px-4 py-3 text-slate-800 outline-none transition-all resize-y peer"
                />
                {!formData.message && (
                  <span className="absolute top-3 left-4 flex items-center text-slate-500 pointer-events-none peer-focus:opacity-30">
                    Message <span className="text-red-500 ml-1">*</span>
                  </span>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#24426A] hover:bg-[#1a3152] text-white font-medium py-2.5 px-8 rounded-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
