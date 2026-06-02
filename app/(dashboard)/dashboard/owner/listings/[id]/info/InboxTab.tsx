'use client'

import { useEffect, useState, useRef } from 'react'
import { Loader2, Inbox as InboxIcon, Send, User, Building } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function InboxTab({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(true)
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [selectedEnquiry, setSelectedEnquiry] = useState<any | null>(null)
  
  const [messages, setMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchEnquiries() {
      try {
        const res = await fetch(`/api/listings/${listingId}/enquiries`)
        if (res.ok) {
          const data = await res.json()
          setEnquiries(data)
          if (data.length > 0) setSelectedEnquiry(data[0])
        }
      } catch (err) {
        console.error('Failed to load enquiries', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEnquiries()
  }, [listingId])

  useEffect(() => {
    if (!selectedEnquiry) return
    async function fetchMessages() {
      setLoadingMessages(true)
      try {
        const res = await fetch(`/api/enquiries/${selectedEnquiry.id}/messages`)
        if (res.ok) setMessages(await res.json())
      } catch (err) {
        console.error('Failed to load messages', err)
      } finally {
        setLoadingMessages(false)
        scrollToBottom()
      }
    }
    fetchMessages()
  }, [selectedEnquiry])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSendReply = async () => {
    if (!replyContent.trim() || !selectedEnquiry) return
    setSending(true)
    try {
      const res = await fetch(`/api/enquiries/${selectedEnquiry.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent })
      })
      if (res.ok) {
        const newMsg = await res.json()
        setMessages(prev => [...prev, newMsg])
        setReplyContent('')
        scrollToBottom()
      }
    } catch (err) {
      console.error('Failed to send reply', err)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white rounded-3xl border border-slate-200">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading inbox...</p>
      </div>
    )
  }

  if (enquiries.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm mt-8">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500 mb-6">
          <InboxIcon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Inbox is empty</h3>
        <p className="text-slate-500 text-sm">No conversations found for this listing.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex h-[600px]">
      {/* Sidebar - Conversation List */}
      <div className="w-1/3 border-r border-slate-100 bg-slate-50 overflow-y-auto">
        <div className="p-4 border-b border-slate-200 bg-white sticky top-0">
          <h3 className="font-bold text-slate-800">Conversations</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {enquiries.map(enq => (
            <button
              key={enq.id}
              onClick={() => setSelectedEnquiry(enq)}
              className={`w-full text-left p-4 transition-colors flex items-start gap-3 ${
                selectedEnquiry?.id === enq.id ? 'bg-teal-50/50' : 'hover:bg-slate-100'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold flex-shrink-0">
                {enq.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                  <h4 className={`font-bold text-sm truncate ${selectedEnquiry?.id === enq.id ? 'text-teal-900' : 'text-slate-900'}`}>
                    {enq.name}
                  </h4>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {formatDistanceToNow(new Date(enq.updatedAt), { addSuffix: true }).replace('about ', '')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{enq.messages?.[0]?.content || '...'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main - Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
           <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
             {selectedEnquiry.name.charAt(0).toUpperCase()}
           </div>
           <div>
             <h3 className="font-bold text-slate-900">{selectedEnquiry.name}</h3>
             <p className="text-xs font-semibold text-slate-500">{selectedEnquiry.email}</p>
           </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {loadingMessages ? (
            <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : (
            messages.map((msg, idx) => {
              const isLister = msg.sender === 'LISTER'
              return (
                <div key={msg.id || idx} className={`flex ${isLister ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl p-4 ${
                    isLister 
                      ? 'bg-teal-600 text-white rounded-br-sm' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div className={`text-[10px] mt-2 font-semibold flex items-center gap-1 ${isLister ? 'text-teal-100' : 'text-slate-400'}`}>
                       {formatDistanceToNow(new Date(msg.createdAt))} ago
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex items-end gap-3">
            <textarea 
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 border-2 border-slate-200 focus:border-teal-500 rounded-2xl p-3 text-sm outline-none resize-none max-h-32 transition-colors"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendReply()
                }
              }}
            />
            <button 
              onClick={handleSendReply}
              disabled={sending || !replyContent.trim()}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white p-3.5 rounded-2xl shadow-sm transition-colors mb-0.5"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 text-center mt-2">Press Enter to send, Shift + Enter for new line</p>
        </div>
      </div>
    </div>
  )
}
