'use client'

import { useState, useCallback } from 'react'
import { useToast } from './ToastProvider'
import { compressImages, formatFileSize } from '@/lib/imageUtils'

interface UploadFile {
  file: File
  preview: string
  title: string
  description: string
  compressed?: boolean
  originalSize?: number
  compressedSize?: number
}

interface BatchUploadDialogProps {
  onClose: () => void
  onUpload: (files: UploadFile[]) => Promise<void>
  uploading: boolean
}

export default function BatchUploadDialog({
  onClose,
  onUpload,
  uploading,
}: BatchUploadDialogProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const { info, warning } = useToast()

  const addFiles = useCallback(
    async (newFiles: File[]) => {
      if (files.length + newFiles.length > 10) {
        warning('最多只能同时上传 10 张照片')
        newFiles = newFiles.slice(0, 10 - files.length)
      }

      setCompressing(true)
      info('正在压缩图片...')

      try {
        const compressedFiles = await compressImages(newFiles)

        const uploadFiles: UploadFile[] = compressedFiles.map((file, index) => ({
          file,
          preview: URL.createObjectURL(file),
          title: '',
          description: '',
          compressed: true,
          originalSize: newFiles[index].size,
          compressedSize: file.size,
        }))

        setFiles((prev) => [...prev, ...uploadFiles])
        info(`已添加 ${uploadFiles.length} 张照片`)
      } catch (error) {
        warning('部分图片压缩失败')
      } finally {
        setCompressing(false)
      }
    },
    [files.length, warning, info]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      )

      if (droppedFiles.length > 0) {
        addFiles(droppedFiles)
      } else {
        warning('请只拖入图片文件')
      }
    },
    [warning, addFiles]
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      addFiles(Array.from(selectedFiles))
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const updateFile = (index: number, field: 'title' | 'description', value: string) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      newFiles[index][field] = value
      return newFiles
    })
  }

  const handleUpload = async () => {
    if (files.some((f) => !f.title.trim())) {
      warning('请为所有照片填写标题')
      return
    }

    await onUpload(files)

    // 清理预览 URL
    files.forEach((f) => URL.revokeObjectURL(f.preview))
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-primary">批量上传照片</h2>
            <p className="text-sm text-gray-600 mt-1">
              已选择 {files.length} 张照片 {files.length > 0 && `(最多 10 张)`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            disabled={uploading}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Drag & Drop Zone */}
          {files.length < 10 && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-all ${
                dragActive
                  ? 'border-primary bg-primary/5 scale-105'
                  : 'border-gray-300 hover:border-primary'
              }`}
            >
              <div className="text-6xl mb-4">📸</div>
              <p className="text-lg font-semibold mb-2">拖拽照片到这里</p>
              <p className="text-sm text-gray-600 mb-4">或者</p>
              <label className="btn-primary cursor-pointer inline-block">
                选择照片
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={compressing || uploading}
                />
              </label>
              <p className="text-xs text-gray-500 mt-4">支持 JPG、PNG、GIF 等格式，自动压缩</p>
            </div>
          )}

          {/* File List */}
          {compressing && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-gray-600">正在压缩图片...</p>
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-all"
                >
                  <div className="flex gap-4">
                    {/* Preview */}
                    <div className="relative w-32 h-32 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={file.preview}
                        alt={`预览 ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-all"
                        disabled={uploading}
                      >
                        ×
                      </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder={`照片标题 ${index + 1} *`}
                        value={file.title}
                        onChange={(e) => updateFile(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                        disabled={uploading}
                      />
                      <textarea
                        placeholder="照片描述（可选）"
                        value={file.description}
                        onChange={(e) => updateFile(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none resize-none"
                        rows={2}
                        disabled={uploading}
                      />
                      <div className="flex gap-4 text-xs text-gray-600">
                        <span>原始: {formatFileSize(file.originalSize || 0)}</span>
                        <span>压缩后: {formatFileSize(file.compressedSize || 0)}</span>
                        {file.originalSize && file.compressedSize && (
                          <span className="text-green-600">
                            节省 {Math.round((1 - file.compressedSize / file.originalSize) * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {files.length > 0 && (
          <div className="p-6 border-t border-gray-200 flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition-all"
              disabled={uploading}
            >
              取消
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || files.some((f) => !f.title.trim())}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? '上传中...' : `上传 ${files.length} 张照片`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
