'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Send,
  Building,
  MapPin,
  Image as ImageIcon,
  MessageCircle,
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
  status: 'REPLIED' | 'AWAITING_REPLY'
  listing: EnquiryListing
  messages: EnquiryMessage[]
}

interface ContactedRowClientProps {
  enquiry: Enquiry
  isExpanded: boolean
  onToggle: () => void
  formatDate: (d: string) => string
}

export default function ContactedRowClient({ enquiry, isExpanded, onToggle, formatDate }: ContactedRowClientProps) {
  const [messages, setMessages] = useState<EnquiryMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const rawThumbnailUrl = enquiry.listing.media?.[0]?.optimizedUrl || enquiry.listing.media?.[0]?.originalUrl
  const isCloudinary = rawThumbnailUrl?.includes('res.cloudinary.com')
  const thumbnail = isCloudinary 
    ? rawThumbnailUrl.replace('/upload/', '/upload/f_auto,q_auto,w_800/') 
    : rawThumbnailUrl
    
  const blurDataURL = isCloudinary ? rawThumbnailUrl.replace('/upload/', '/upload/w_50,e_blur:1000/') : undefined

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
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50/50 transition-colors"
      >
        {/* Thumbnail */}
        <div className="w-20 h-20 relative rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
          {thumbnail ? (
            <Image 
              src={thumbnail} 
              alt="" 
              fill
              className="object-cover"
              sizes="80px"
              placeholder={blurDataURL ? 'blur' : 'empty'}
              blurDataURL={blurDataURL}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-slate-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 text-sm truncate">
                {enquiry.listing.title || 'Unnamed Space'}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {enquiry.listing.city && enquiry.listing.state
                  ? `${enquiry.listing.city}, ${enquiry.listing.state}`
                  : 'Location not specified'}
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex-shrink-0">
              {enquiry.status === 'REPLIED' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  <CheckCircle2 className="w-3 h-3" />
                  Replied
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                  <Clock className="w-3 h-3" />
                  Awaiting Reply
                </span>
              )}
            </div>
          </div>

          {/* Date & Preview */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0">
              {formatDate(enquiry.createdAt)}
            </span>
            <span className="text-[10px] text-slate-300">•</span>
            <p className="text-xs text-slate-500 truncate">{messagePreview}{messagePreview.length >= 100 ? '...' : ''}</p>
          </div>
        </div>

        {/* Expand indicator */}
        <div className="flex-shrink-0 text-slate-400">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Expanded Conversation */}
      {isExpanded && (
        <div className="border-t border-slate-100">
          <div className="max-h-80 overflow-y-auto p-5 space-y-3 bg-slate-50/50">
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
                  className={`flex ${msg.sender === 'ENQUIRER' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.sender === 'ENQUIRER'
                        ? 'bg-teal-600 text-white rounded-br-md'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender === 'ENQUIRER' ? 'text-teal-200' : 'text-slate-400'}`}>
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
