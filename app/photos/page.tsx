'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/app/components/ToastProvider'
import BackButton from '@/app/components/BackButton'
import { PhotoGridSkeleton } from '@/app/components/LoadingSkeleton'
import BatchUploadDialog from '@/app/components/BatchUploadDialog'

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
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [batchUploading, setBatchUploading] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const { success, error: showError } = useToast()

  // 导航到上一张或下一张照片
  const navigatePhoto = useCallback(
    (direction: 'prev' | 'next') => {
      if (selectedIndex === -1 || photos.length === 0) return

      let newIndex = direction === 'next' ? selectedIndex + 1 : selectedIndex - 1

      // 循环到开始或结束
      if (newIndex >= photos.length) newIndex = 0
      if (newIndex < 0) newIndex = photos.length - 1

      setSelectedIndex(newIndex)
      setSelectedPhoto(photos[newIndex])
    },
    [selectedIndex, photos]
  )

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return

      if (e.key === 'ArrowLeft') {
        navigatePhoto('prev')
      } else if (e.key === 'ArrowRight') {
        navigatePhoto('next')
      } else if (e.key === 'Escape') {
        setSelectedPhoto(null)
        setSelectedIndex(-1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedPhoto, navigatePhoto])

  // 触摸滑动处理
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      navigatePhoto('next')
    } else if (isRightSwipe) {
      navigatePhoto('prev')
    }
  }

  // 打开照片查看器时设置索引
  const openPhotoViewer = (photo: Photo) => {
    const index = photos.findIndex((p) => p.id === photo.id)
    setSelectedIndex(index)
    setSelectedPhoto(photo)
  }

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
  const handleBatchFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setShowUploadDialog(true)
    // BatchUploadDialog 会处理文件
    e.target.value = ''
  }

  const handleBatchUpload = async (files: { file: File; title: string; description: string }[]) => {
    setBatchUploading(true)
    try {
      for (const f of files) {
        // 上传到 Supabase Storage
        const fileExt = f.file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, f.file)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(filePath)
        // 保存到数据库
        await supabase.from('photos').insert([
          {
            title: f.title || f.file.name,
            description: f.description,
            image_url: urlData.publicUrl,
            uploaded_by: 'zyx',
            likes: 0,
          },
        ])
      }
      success('批量照片上传成功！')
      setShowUploadDialog(false)
    } catch (error) {
      console.error('批量上传失败:', error)
      showError('批量上传失败，请检查网络连接和 Storage 配置')
    } finally {
      setBatchUploading(false)
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
      success('照片已删除')
    } catch (error) {
      console.error('删除失败:', error)
      showError('删除失败，请重试')
    }
  }

  const handleEditPhoto = (photo: Photo) => {
    setEditingPhoto(photo)
    setEditTitle(photo.title)
    setEditDescription(photo.description)
  }

  const handleUpdatePhoto = async () => {
    if (!editingPhoto) return

    try {
      const { error } = await supabase
        .from('photos')
        .update({
          title: editTitle || '未命名照片',
          description: editDescription,
        })
        .eq('id', editingPhoto.id)

      if (error) throw error

      // 更新本地状态
      setPhotos(
        photos.map((photo) =>
          photo.id === editingPhoto.id
            ? { ...photo, title: editTitle || '未命名照片', description: editDescription }
            : photo
        )
      )

      // 如果正在查看这张照片，也更新selectedPhoto
      if (selectedPhoto?.id === editingPhoto.id) {
        setSelectedPhoto({
          ...selectedPhoto,
          title: editTitle || '未命名照片',
          description: editDescription,
        })
      }

      setEditingPhoto(null)
      success('照片信息已更新！')
    } catch (error) {
      console.error('更新失败:', error)
      showError('更新失败，请重试')
    }
  }

  const handleCancelEdit = () => {
    setEditingPhoto(null)
    setEditTitle('')
    setEditDescription('')
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <BackButton />

        <div className="card">
          <h1 className="text-4xl font-bold text-primary mb-8 text-center">📸 我们的相册 📸</h1>

          {loading ? (
            <PhotoGridSkeleton />
          ) : (
            <>
              {/* Upload Section */}
              <div className="mb-8 text-center">
                <label className="btn-primary cursor-pointer inline-block">
                  {batchUploading ? '上传中...' : '+ 批量上传照片'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBatchFileSelect}
                    className="hidden"
                    disabled={batchUploading}
                  />
                </label>
                <p className="text-gray-500 text-sm mt-2">
                  支持 JPG, PNG, GIF 格式，最多 10 张，自动压缩
                </p>
              </div>

              {/* Photos Grid */}
              {photos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
                      onClick={() => openPhotoViewer(photo)}
                    >
                      <div className="relative h-64 bg-gray-200">
                        <Image
                          src={photo.url}
                          alt={photo.title}
                          fill
                          className="object-cover rounded-xl"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority={true}
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
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setSelectedPhoto(null)
              setSelectedIndex(-1)
            }}
          >
            <div
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <Image
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title}
                  width={1200}
                  height={700}
                  className="w-full max-h-[70vh] object-contain bg-gray-100 rounded-xl"
                  style={{ objectFit: 'contain' }}
                  priority={true}
                />

                {/* 关闭按钮 */}
                <button
                  onClick={() => {
                    setSelectedPhoto(null)
                    setSelectedIndex(-1)
                  }}
                  className="absolute top-4 right-4 bg-white rounded-full w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-100 shadow-lg z-10"
                >
                  ×
                </button>

                {/* 上一张/下一张按钮 */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigatePhoto('prev')
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-lg transition-all"
                      aria-label="上一张"
                    >
                      ‹
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigatePhoto('next')
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-lg transition-all"
                      aria-label="下一张"
                    >
                      ›
                    </button>

                    {/* 照片计数 */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {selectedIndex + 1} / {photos.length}
                    </div>
                  </>
                )}
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">{selectedPhoto.title}</h2>
                {selectedPhoto.description && (
                  <p className="text-gray-700 mb-3">{selectedPhoto.description}</p>
                )}
                <p className="text-gray-600 mb-4">
                  上传者: {selectedPhoto.uploadedBy} •{' '}
                  {new Date(selectedPhoto.createdAt).toLocaleDateString('zh-CN')}
                </p>
                <div className="flex gap-4 flex-wrap">
                  <button
                    onClick={() => likePhoto(selectedPhoto.id)}
                    className="btn-primary flex-1 min-w-[120px]"
                  >
                    ❤️ 喜欢 ({selectedPhoto.likes})
                  </button>
                  <button
                    onClick={() => {
                      handleEditPhoto(selectedPhoto)
                      setSelectedPhoto(null)
                      setSelectedIndex(-1)
                    }}
                    className="btn-secondary flex-1 min-w-[120px]"
                  >
                    ✏️ 编辑
                  </button>
                  <button
                    onClick={() => deletePhoto(selectedPhoto.id)}
                    className="btn-secondary flex-1 min-w-[120px] !border-red-500 !text-red-500 hover:!bg-red-50"
                  >
                    🗑️ 删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batch Upload Dialog */}
        {showUploadDialog && (
          <BatchUploadDialog
            onClose={() => setShowUploadDialog(false)}
            onUpload={handleBatchUpload}
            uploading={batchUploading}
          />
        )}

        {/* Edit Photo Dialog */}
        {editingPhoto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-primary mb-4">编辑照片信息</h2>

              <div className="mb-4">
                <Image
                  src={editingPhoto.url}
                  alt={editingPhoto.title}
                  width={600}
                  height={192}
                  className="w-full h-48 object-cover rounded-lg"
                  style={{ objectFit: 'cover' }}
                  priority={true}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">照片标题</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="给这张照片起个名字（可留空）"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">照片描述</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="记录这一刻的故事...（可留空）"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleCancelEdit} className="btn-secondary flex-1">
                  取消
                </button>
                <button onClick={handleUpdatePhoto} className="btn-primary flex-1">
                  保存修改
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
