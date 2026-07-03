'use client'
import React, { useRef, useState } from 'react'
import { MonitorPlay, Image as ImageIcon, Video, X } from 'lucide-react'
import { useLectureCreator } from './LectureCreatorContext'
import { Button } from '../../ui/Button'

export default function LectureMediaCard() {
  const { coverImage, setCoverImage, videoUrl, setVideoUrl } = useLectureCreator()
  const [activeTab, setActiveTab] = useState<'image' | 'video'>(videoUrl ? 'video' : 'image')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setCoverImage(url)
    }
  }

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCoverImage(null)
  }

  // Extract Youtube ID
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const youtubeId = getYoutubeId(videoUrl)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mb-6">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-2 px-2">
          <MonitorPlay className="text-primary w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">0. Đa phương tiện (Tùy chọn)</h2>
        </div>

        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${activeTab === 'image' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('image')}
          >
            <ImageIcon className="w-3 h-3" /> Ảnh bìa
          </button>
          <button
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${activeTab === 'video' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('video')}
          >
            <Video className="w-3 h-3" /> Video YouTube
          </button>
        </div>
      </div>

      <div className="p-8 flex-grow">
        {activeTab === 'image' && (
          <div className="flex flex-col gap-4">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div
              onClick={handleImageClick}
              className={`relative group border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center min-h-[300px] hover:border-primary/50 transition-colors cursor-pointer overflow-hidden ${coverImage ? 'bg-slate-900' : 'bg-slate-50/50'}`}
            >
              {coverImage ? (
                <>
                  <img src={coverImage} alt="Cover" className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <button
                      onClick={handleRemoveImage}
                      className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors text-sm shadow-md transform scale-95 group-hover:scale-100"
                    >
                      Xóa ảnh bìa
                    </button>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 mx-auto text-slate-300 group-hover:text-primary transition-colors" />
                    <p className="mt-3 text-xs text-slate-500 font-bold uppercase tracking-widest">Tải ảnh bìa bài giảng</p>
                    <p className="mt-1 text-xs text-slate-400">Khuyến nghị tỷ lệ 16:9</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'video' && (
          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Link YouTube</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ví dụ: https://www.youtube.com/watch?v=..."
                  className="flex-grow px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                {videoUrl && (
                  <Button variant="ghost" className="text-slate-400 hover:text-red-500" onClick={() => setVideoUrl('')}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {videoUrl && (
              <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border border-slate-200">
                {youtubeId ? (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="text-slate-500 text-sm flex flex-col items-center">
                    <Video className="w-8 h-8 mb-2 opacity-50" />
                    <p>Đường dẫn YouTube không hợp lệ</p>
                  </div>
                )}
              </div>
            )}

            {!videoUrl && (
              <div className="relative w-full rounded-2xl overflow-hidden bg-slate-50/50 aspect-[21/9] flex items-center justify-center border-2 border-dashed border-slate-200">
                <div className="text-center">
                  <MonitorPlay className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Dán link YouTube vào ô phía trên</p>
                  <p className="mt-1 text-xs text-slate-400">Video sẽ xuất hiện ở đây để bạn xem trước</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
