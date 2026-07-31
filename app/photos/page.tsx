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
  tag?: string
}

const photoFilters = {
  normal: { name: '原图', css: '' },
  vintage: { name: '复古', css: 'sepia(50%) contrast(110%)' },
  grayscale: { name: '黑白', css: 'grayscale(100%)' },
  warm: { name: '暖色', css: 'sepia(30%) saturate(150%)' },
  cold: { name: '冷色', css: 'hue-rotate(180deg) saturate(120%)' },
  bright: { name: '明亮', css: 'brightness(120%) contrast(110%)' },
  dreamy: { name: '梦幻', css: 'blur(0.5px) brightness(110%) saturate(130%)' },
  pink: { name: '粉嫩', css: 'sepia(20%) hue-rotate(300deg) saturate(150%)' },
}

const photoTags = ['全部', '约会', '美食', '旅行', '自拍', '风景', '日常', '节日']

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [batchUploading, setBatchUploading] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [currentFilter, setCurrentFilter] = useState<keyof typeof photoFilters>('normal')
  const [currentTag, setCurrentTag] = useState('全部')
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid')
  const [slideshowActive, setSlideshowActive] = useState(false)
  const [slideshowIndex, setSlideshowIndex] = useState(0)
  const { success, error: showError } = useToast()

  // 加载保存的滤镜偏好
  useEffect(() => {
    const savedFilter = localStorage.getItem('photoFilter')
    if (savedFilter && photoFilters[savedFilter as keyof typeof photoFilters]) {
      setCurrentFilter(savedFilter as keyof typeof photoFilters)
    }
  }, [])

  // 保存滤镜偏好
  const handleFilterChange = (filter: keyof typeof photoFilters) => {
    setCurrentFilter(filter)
    localStorage.setItem('photoFilter', filter)
  }

  // 过滤照片
  useEffect(() => {
    let filtered = photos
    if (currentTag !== '全部') {
      filtered = photos.filter((photo) => photo.tag === currentTag)
    }
    setFilteredPhotos(filtered)
  }, [currentTag, photos])

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

  const handleBatchUpload = async (
    files: { file: File; title: string; description: string; tag?: string }[]
  ) => {
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
            tag: f.tag || '日常',
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
              {/* 过滤器和标签栏 */}
              <div className="mb-6 space-y-4">
                {/* 滤镜选择 */}
                <div className="bg-white rounded-2xl p-4 shadow-lg">
                  <h3 className="font-bold mb-3 text-gray-800">滤镜效果 🎨</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {Object.entries(photoFilters).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => handleFilterChange(key as keyof typeof photoFilters)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                          currentFilter === key
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {value.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 标签筛选 */}
                <div className="bg-white rounded-2xl p-4 shadow-lg">
                  <h3 className="font-bold mb-3 text-gray-800">照片分类 🏷️</h3>
                  <div className="flex gap-2 flex-wrap">
                    {photoTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setCurrentTag(tag)}
                        className={`px-4 py-2 rounded-full transition-all ${
                          currentTag === tag
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 视图模式切换 */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 rounded-lg ${
                      viewMode === 'grid' ? 'bg-pink-500 text-white' : 'bg-white text-gray-700'
                    }`}
                  >
                    📷 网格
                  </button>
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`px-4 py-2 rounded-lg ${
                      viewMode === 'timeline' ? 'bg-pink-500 text-white' : 'bg-white text-gray-700'
                    }`}
                  >
                    📅 时间轴
                  </button>
                  {filteredPhotos.length > 1 && (
                    <button
                      onClick={() => {
                        setSlideshowIndex(0)
                        setSlideshowActive(true)
                      }}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg transition-all"
                    >
                      ▶️ 幻灯片
                    </button>
                  )}
                </div>
              </div>

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

              {/* Photos Display */}
              {filteredPhotos.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPhotos.map((photo) => (
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
                            style={{ filter: photoFilters[currentFilter].css }}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority={true}
                          />
                          {photo.tag && (
                            <span className="absolute top-2 right-2 bg-white/90 px-3 py-1 rounded-full text-sm font-semibold text-pink-600">
                              {photo.tag}
                            </span>
                          )}
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
                  /* 时间轴视图 */
                  <div className="space-y-8">
                    {Object.entries(
                      filteredPhotos.reduce((acc, photo) => {
                        const date = new Date(photo.createdAt).toLocaleDateString('zh-CN')
                        if (!acc[date]) acc[date] = []
                        acc[date].push(photo)
                        return acc
                      }, {} as Record<string, Photo[]>)
                    )
                      .sort(
                        ([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime()
                      )
                      .map(([date, dayPhotos]) => (
                        <div key={date}>
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-xl font-bold text-gray-800">{date}</h3>
                            <div className="flex-1 h-px bg-gray-300"></div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dayPhotos.map((photo) => (
                              <div
                                key={photo.id}
                                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
                                onClick={() => openPhotoViewer(photo)}
                              >
                                <div className="relative h-48 bg-gray-200">
                                  <Image
                                    src={photo.url}
                                    alt={photo.title}
                                    fill
                                    className="object-cover"
                                    style={{ filter: photoFilters[currentFilter].css }}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  />
                                  {photo.tag && (
                                    <span className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-full text-xs font-semibold text-pink-600">
                                      {photo.tag}
                                    </span>
                                  )}
                                </div>
                                <div className="p-3">
                                  <h4 className="font-semibold truncate">{photo.title}</h4>
                                  <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                                    <span>{photo.uploadedBy}</span>
                                    <span>❤️ {photo.likes}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📷</div>
                  <p className="text-gray-500 text-lg">
                    {currentTag !== '全部'
                      ? `暂无 "${currentTag}" 分类的照片`
                      : '还没有照片，赶快上传第一张吧！'}
                  </p>
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
                <Image
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title}
                  width={1200}
                  height={700}
                  className="w-full max-h-[70vh] object-contain bg-gray-100 rounded-xl"
                  style={{ objectFit: 'contain', filter: photoFilters[currentFilter].css }}
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
        {/* Slideshow Modal */}
        {slideshowActive && filteredPhotos.length > 0 && (
          <SlideshowModal
            photos={filteredPhotos}
            currentIndex={slideshowIndex}
            onClose={() => setSlideshowActive(false)}
            onIndexChange={setSlideshowIndex}
            filter={photoFilters[currentFilter].css}
          />
        )}
      </div>
    </div>
  )
}

// 幻灯片组件
function SlideshowModal({
  photos,
  currentIndex,
  onClose,
  onIndexChange,
  filter,
}: {
  photos: Photo[]
  currentIndex: number
  onClose: () => void
  onIndexChange: (index: number) => void
  filter: string
}) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [interval, setIntervalTime] = useState(3000)

  useEffect(() => {
    if (!isPlaying) return

    const timer = setInterval(() => {
      onIndexChange((currentIndex + 1) % photos.length)
    }, interval)

    return () => clearInterval(timer)
  }, [isPlaying, currentIndex, photos.length, interval, onIndexChange])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onIndexChange((currentIndex - 1 + photos.length) % photos.length)
      if (e.key === 'ArrowRight') onIndexChange((currentIndex + 1) % photos.length)
      if (e.key === ' ') {
        e.preventDefault()
        setIsPlaying(!isPlaying)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, photos.length, isPlaying, onClose, onIndexChange])

  const currentPhoto = photos[currentIndex]

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent z-10 flex items-center justify-between">
        <div className="text-white">
          <h3 className="font-bold text-lg">{currentPhoto.title}</h3>
          <p className="text-sm text-white/70">
            {currentIndex + 1} / {photos.length}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white text-3xl hover:text-pink-400 transition-colors"
        >
          ×
        </button>
      </div>

      {/* Photo */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Image
          src={currentPhoto.url}
          alt={currentPhoto.title}
          width={1200}
          height={800}
          className="max-w-full max-h-full object-contain transition-all duration-500"
          style={{ filter }}
          priority
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => onIndexChange((currentIndex - 1 + photos.length) % photos.length)}
            className="text-white text-2xl hover:text-pink-400 transition-colors p-2"
          >
            ⏮️
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-white text-3xl hover:text-pink-400 transition-colors p-2"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button
            onClick={() => onIndexChange((currentIndex + 1) % photos.length)}
            className="text-white text-2xl hover:text-pink-400 transition-colors p-2"
          >
            ⏭️
          </button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center justify-center gap-2 text-white text-sm">
          <span>速度:</span>
          {[2000, 3000, 5000].map((speed) => (
            <button
              key={speed}
              onClick={() => setIntervalTime(speed)}
              className={`px-3 py-1 rounded-full ${
                interval === speed ? 'bg-pink-500' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {speed / 1000}s
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1 mt-4 justify-center">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => onIndexChange(i)}
              className={`h-1 rounded-full transition-all ${
                i === currentIndex ? 'w-8 bg-pink-500' : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
