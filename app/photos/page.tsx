'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface Photo {
  id: string
  title: string
  description: string
  url: string
  uploadedBy: string
  createdAt: string
  likes: number
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  // 加载数据并设置实时订阅
  useEffect(() => {
    loadPhotos()

    // 订阅photos表的实时更新
    const channel = supabase
      .channel('photos_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // 监听所有事件: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'photos',
        },
        (payload) => {
          console.log('照片更新:', payload)

          if (payload.eventType === 'INSERT') {
            // 新照片插入
            const newPhoto = {
              id: payload.new.id,
              title: payload.new.title || '未命名照片',
              description: payload.new.description || '',
              url: payload.new.image_url,
              uploadedBy: payload.new.uploaded_by,
              createdAt: payload.new.created_at,
              likes: payload.new.likes || 0,
            }
            setPhotos((prev) => [newPhoto, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            // 照片更新（如点赞）
            setPhotos((prev) =>
              prev.map((photo) =>
                photo.id === payload.new.id
                  ? {
                      ...photo,
                      title: payload.new.title || '未命名照片',
                      description: payload.new.description || '',
                      likes: payload.new.likes || 0,
                    }
                  : photo
              )
            )
          } else if (payload.eventType === 'DELETE') {
            // 照片删除
            setPhotos((prev) => prev.filter((photo) => photo.id !== payload.old.id))
            if (selectedPhoto?.id === payload.old.id) {
              setSelectedPhoto(null)
            }
          }
        }
      )
      .subscribe()

    // 清理订阅
    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedPhoto?.id])

  const loadPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setPhotos(
          data.map((item) => ({
            id: item.id,
            title: item.title || '未命名照片',
            description: item.description || '',
            url: item.image_url,
            uploadedBy: item.uploaded_by,
            createdAt: item.created_at,
            likes: item.likes || 0,
          }))
        )
      }
    } catch (error) {
      console.error('加载照片失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 上传照片到 Supabase Storage
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      const file = files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      // 上传到 Supabase Storage
      const { error: uploadError } = await supabase.storage.from('photos').upload(filePath, file)

      if (uploadError) throw uploadError

      // 获取公开 URL
      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(filePath)

      // 保存到数据库
      const { data, error: dbError } = await supabase
        .from('photos')
        .insert([
          {
            title: file.name,
            description: '',
            image_url: urlData.publicUrl,
            uploaded_by: 'zyx', // 可以改成动态输入
            likes: 0,
          },
        ])
        .select()

      if (dbError) throw dbError

      if (data) {
        const newPhoto = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description || '',
          url: data[0].image_url,
          uploadedBy: data[0].uploaded_by,
          createdAt: data[0].created_at,
          likes: data[0].likes || 0,
        }
        setPhotos([newPhoto, ...photos])
      }
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败，请检查网络连接和 Storage 配置')
    } finally {
      setUploading(false)
    }
  }

  const likePhoto = async (id: string) => {
    try {
      const photo = photos.find((p) => p.id === id)
      if (!photo) return

      const { error } = await supabase
        .from('photos')
        .update({ likes: photo.likes + 1 })
        .eq('id', id)

      if (error) throw error

      setPhotos(
        photos.map((photo) => (photo.id === id ? { ...photo, likes: photo.likes + 1 } : photo))
      )
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }

  const deletePhoto = async (id: string) => {
    if (!confirm('确定要删除这张照片吗？')) return

    try {
      // 先从数据库获取照片信息，以便删除 Storage 中的文件
      const photo = photos.find((p) => p.id === id)
      if (photo) {
        // 从 URL 中提取文件路径
        const urlParts = photo.url.split('/photos/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          // 删除 Storage 中的文件
          await supabase.storage.from('photos').remove([filePath])
        }
      }

      // 删除数据库记录
      const { error } = await supabase.from('photos').delete().eq('id', id)

      if (error) throw error

      setPhotos(photos.filter((photo) => photo.id !== id))
      setSelectedPhoto(null)
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-block mb-6 text-white hover:text-primary transition-colors"
        >
          ← 返回首页
        </Link>

        <div className="card">
          <h1 className="text-4xl font-bold text-primary mb-8 text-center">📸 我们的相册 📸</h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-2xl">加载中... ⏳</div>
            </div>
          ) : (
            <>
              {/* Upload Section */}
              <div className="mb-8 text-center">
                <label className="btn-primary cursor-pointer inline-block">
                  {uploading ? '上传中...' : '+ 上传照片'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="hidden"
                    disabled={uploading}
                    multiple
                  />
                </label>
                <p className="text-gray-500 text-sm mt-2">支持 JPG, PNG, GIF 格式</p>
              </div>

              {/* Photos Grid */}
              {photos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <div className="relative h-64 bg-gray-200">
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2 truncate">{photo.title}</h3>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>上传者: {photo.uploadedBy}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              likePhoto(photo.id)
                            }}
                            className="flex items-center gap-1 hover:text-red-500 transition-colors"
                          >
                            ❤️ {photo.likes}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📷</div>
                  <p className="text-gray-500 text-lg">还没有照片，赶快上传第一张吧！</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Photo Modal */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title}
                  className="w-full max-h-[70vh] object-contain"
                />
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-4 right-4 bg-white rounded-full w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-100"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">{selectedPhoto.title}</h2>
                <p className="text-gray-600 mb-4">
                  上传者: {selectedPhoto.uploadedBy} •{' '}
                  {new Date(selectedPhoto.createdAt).toLocaleDateString('zh-CN')}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => likePhoto(selectedPhoto.id)}
                    className="btn-primary flex-1"
                  >
                    ❤️ 喜欢 ({selectedPhoto.likes})
                  </button>
                  <button
                    onClick={() => deletePhoto(selectedPhoto.id)}
                    className="btn-secondary flex-1 !border-red-500 !text-red-500 hover:!bg-red-50"
                  >
                    🗑️ 删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
