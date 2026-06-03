'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Send,
  MapPin,
  Image as ImageIcon,
  MessageSquare,
  AlertCircle,
} from 'lucide-react'

interface EnquiryMessage {
  id: string
  content: string
  sender: 'ENQUIRER' | 'LISTER'
  createdAt: string
}

interface EnquiryListing {
  id: string
  title: string | null
  slug: string
  city: string | null
  state: string | null
  spaceType: string | null
  media: { id: string; originalUrl: string; optimizedUrl?: string | null }[]
}

interface Enquiry {
  id: string
  listingId: string
  name: string
  email: string
  phone: string | null
  createdAt: string
  updatedAt: string
  status: 'REPLIED' | 'ACTION_REQUIRED'
  listing: EnquiryListing
  messages: EnquiryMessage[]
}

export default function OwnerEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchEnquiries()
  }, [])

  const fetchEnquiries = async () => {
    try {
      const res = await fetch('/api/owner/enquiries')
      const data = await res.json()
      if (data.enquiries) setEnquiries(data.enquiries)
    } catch (err) {
      console.error('Failed to fetch enquiries', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Enquiries Inbox
        </h1>
        <p className="text-slate-500 mt-1">Manage messages from interested medical professionals.</p>
      </div>

      {loading ? (
        <div className="space-y-4 mt-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl border border-slate-200 p-5 flex gap-4">
              <div className="w-20 h-20 bg-slate-100 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/4" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : enquiries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 px-6 mt-8 shadow-sm">
          <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-9 h-9" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No enquiries yet</h3>
          <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
            When seekers contact you about your listings, their messages will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4 mt-8">
          {enquiries.map((enq) => (
            <OwnerEnquiryRow
              key={enq.id}
              enquiry={enq}
              isExpanded={expandedId === enq.id}
              onToggle={() => setExpandedId(expandedId === enq.id ? null : enq.id)}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </>
  )
}

// ─── Individual Enquiry Row with expandable conversation ────────────────────
interface EnquiryRowProps {
  enquiry: Enquiry
  isExpanded: boolean
  onToggle: () => void
  formatDate: (d: string) => string
}

function OwnerEnquiryRow({ enquiry, isExpanded, onToggle, formatDate }: EnquiryRowProps) {
  const [messages, setMessages] = useState<EnquiryMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const thumbnail = enquiry.listing.media?.[0]?.originalUrl || enquiry.listing.media?.[0]?.optimizedUrl
  const messagePreview = enquiry.messages?.[0]?.content?.substring(0, 100) || 'No message preview'

  // Load full conversation when expanded
  useEffect(() => {
    if (isExpanded && messages.length === 0) {
      loadMessages()
    }
  }, [isExpanded])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const loadMessages = async () => {
    setMessagesLoading(true)
    try {
      const res = await fetch(`/api/enquiries/${enquiry.id}/messages`)
      const data = await res.json()
      if (Array.isArray(data)) setMessages(data)
    } catch (err) {
      console.error('Failed to load messages', err)
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/enquiries/${enquiry.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim() }),
      })
      const newMsg = await res.json()
      if (newMsg.id) {
        setMessages(prev => [...prev, { ...newMsg, createdAt: newMsg.createdAt || new Date().toISOString() }])
        setReplyText('')
      }
    } catch (err) {
      console.error('Failed to send reply', err)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Main Row */}
      <button
        onClick={onToggle}
        className="w-full flex flex-col md:flex-row md:items-center gap-4 p-5 text-left hover:bg-slate-50/50 transition-colors"
      >
        {/* Listing Thumbnail & Info (Left side) */}
        <div className="flex items-center gap-4 w-full md:w-1/3 shrink-0">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
            {thumbnail ? (
              <img src={thumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-slate-300" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 text-sm truncate">
              {enquiry.listing.title || 'Unnamed Space'}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {enquiry.listing.city && enquiry.listing.state
                  ? `${enquiry.listing.city}, ${enquiry.listing.state}`
                  : 'Location not specified'}
              </span>
            </p>
          </div>
        </div>

        {/* Enquirer Info & Message Preview (Middle) */}
        <div className="flex-1 min-w-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-sm text-slate-700">{enquiry.name}</span>
            <span className="text-[10px] text-slate-400 font-semibold">{formatDate(enquiry.createdAt)}</span>
          </div>
          <p className="text-xs text-slate-500 truncate">{messagePreview}{messagePreview.length >= 100 ? '...' : ''}</p>
        </div>

        {/* Status Badge & Toggle Indicator (Right side) */}
        <div className="flex items-center justify-between md:justify-end md:w-32 flex-shrink-0 gap-4 mt-2 md:mt-0">
          {enquiry.status === 'ACTION_REQUIRED' ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
              <AlertCircle className="w-3 h-3" />
              New Message
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <CheckCircle2 className="w-3 h-3" />
              Replied
            </span>
          )}
          
          <div className="text-slate-400">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* Expanded Conversation */}
      {isExpanded && (
        <div className="border-t border-slate-100">
          {/* Seeker Contact Info Header */}
          <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex flex-wrap gap-4 text-xs">
            <div className="flex flex-col">
              <span className="text-slate-400 font-semibold mb-0.5">Email</span>
              <a href={`mailto:${enquiry.email}`} className="text-teal-600 font-medium hover:underline">{enquiry.email}</a>
            </div>
            {enquiry.phone && (
              <div className="flex flex-col">
                <span className="text-slate-400 font-semibold mb-0.5">Phone</span>
                <a href={`tel:${enquiry.phone}`} className="text-slate-700 font-medium hover:underline">{enquiry.phone}</a>
              </div>
            )}
          </div>

          {/* Messages Thread */}
          <div className="max-h-80 overflow-y-auto p-5 space-y-3 bg-slate-50/30">
            {messagesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex gap-2">
                    <div className={`w-2/3 h-12 bg-slate-100 rounded-2xl ${i % 2 === 0 ? 'ml-auto' : ''}`} />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No messages in this thread</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'LISTER' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.sender === 'LISTER'
                        ? 'bg-teal-600 text-white rounded-br-md'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender === 'LISTER' ? 'text-teal-200' : 'text-slate-400'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Input */}
          <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || sending}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
