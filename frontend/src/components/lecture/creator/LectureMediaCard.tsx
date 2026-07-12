'use client'
import React, { useRef, useState } from 'react'
import { MonitorPlay, Image as ImageIcon, Video, X, Plus } from 'lucide-react'
import { useLectureCreator, MediaItem } from './LectureCreatorContext'
import { Button } from '../../ui/Button'

export default function LectureMediaCard() {
  const { mediaItems, setMediaItems } = useLectureCreator()
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image')
  const [videoInput, setVideoInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setMediaItems([...mediaItems, { id: Math.random().toString(36).substr(2, 9), type: 'image', url }])
    }
    // reset input so the same file can be selected again
    if (e.target) {
      e.target.value = ''
    }
  }

  const handleRemoveMedia = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setMediaItems(mediaItems.filter(item => item.id !== id))
  }

  const handleAddVideo = () => {
    if (videoInput.trim()) {
      setMediaItems([...mediaItems, { id: Math.random().toString(36).substr(2, 9), type: 'video', url: videoInput.trim() }])
      setVideoInput('')
    }
  }

  // Extract Youtube ID
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mb-6">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-2 px-2">
          <MonitorPlay className="text-primary w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">1. Giải thích khái niệm</h2>
        </div>

        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${activeTab === 'image' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('image')}
          >
            <ImageIcon className="w-3 h-3" /> Thêm Ảnh
          </button>
          <button
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${activeTab === 'video' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('video')}
          >
            <Video className="w-3 h-3" /> Thêm Video YouTube
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* ADD MEDIA SECTION */}
        {activeTab === 'image' && (
          <div className="mb-6">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Button 
              variant="outline" 
              className="w-full border-dashed border-2 border-slate-200 text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 h-12 rounded-xl"
              onClick={handleImageClick}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Chọn ảnh từ máy tính
            </Button>
          </div>
        )}

        {activeTab === 'video' && (
          <div className="mb-6 flex gap-2">
            <input
              type="text"
              placeholder="Dán link YouTube vào đây..."
              className="flex-grow px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddVideo()
                }
              }}
            />
            <Button variant="primary" className="bg-primary hover:bg-primary-dark text-white px-6 rounded-xl" onClick={handleAddVideo}>
              Thêm
            </Button>
          </div>
        )}

        {/* MEDIA LIST */}
        {mediaItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mediaItems.map((item, idx) => {
              if (item.type === 'image') {
                return (
                  <div key={item.id} className="relative group border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 aspect-video flex flex-col items-center justify-center">
                    <img src={item.url} alt={`Media ${idx}`} className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center bg-black/40">
                      <button
                        onClick={(e) => handleRemoveMedia(item.id, e)}
                        className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors text-sm shadow-md transform scale-95 group-hover:scale-100"
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  </div>
                )
              } else {
                const yId = getYoutubeId(item.url)
                return (
                  <div key={item.id} className="relative w-full rounded-2xl overflow-hidden bg-slate-900 aspect-video border border-slate-200 group">
                    {yId ? (
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${yId}?rel=0`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-slate-500 text-sm bg-slate-100">
                        <Video className="w-8 h-8 mb-2 opacity-50" />
                        <p>Đường dẫn YouTube không hợp lệ</p>
                      </div>
                    )}
                    
                    {/* Delete button wrapper - since iframe captures clicks, we overlay a small button area or use a corner button */}
                    <button
                      onClick={(e) => handleRemoveMedia(item.id, e)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500/90 hover:bg-red-600 text-white rounded-lg shadow-lg flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                      title="Xóa video"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )
              }
            })}
          </div>
        )}
        
        {mediaItems.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
            <p className="text-slate-400 text-sm">Chưa có ảnh/video nào được thêm.</p>
          </div>
        )}

      </div>
    </div>
  )
}
