import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [fileUrls, setFileUrls] = useState({ rawUrl: '', githubUrl: '', commitUrl: '' })

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (selectedFile.size > 100 * 1024 * 1024) {
        alert('File size must be less than 100MB')
        return
      }
      setFile(selectedFile)
      // Set default file name without extension
      setFileName(selectedFile.name.replace(/\.[^/.]+$/, ""))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setUploadStatus({ type: 'error', message: 'Please select a file' })
      return
    }

    setIsUploading(true)
    setUploadStatus(null)
    setFileUrls({ rawUrl: '', githubUrl: '', commitUrl: '' })

    try {
      const reader = new FileReader()
      
      reader.onload = async (event) => {
        try {
          const base64 = event.target.result.split(',')[1]
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: base64,
              fileName: fileName || file.name.replace(/\.[^/.]+$/, ""),
              originalName: file.name,
              fileType: file.type,
            }),
          })

          const result = await response.json()

          if (response.ok) {
            setUploadStatus({ type: 'success', message: 'File uploaded successfully!' })
            setFileUrls({
              rawUrl: result.rawUrl,
              githubUrl: result.githubUrl,
              commitUrl: result.commitUrl
            })
          } else {
            setUploadStatus({ type: 'error', message: result.error || 'Upload failed' })
          }
        } catch (error) {
          setUploadStatus({ type: 'error', message: 'Error processing upload: ' + error.message })
        } finally {
          setIsUploading(false)
        }
      }

      reader.onerror = () => {
        setUploadStatus({ type: 'error', message: 'Error reading file' })
        setIsUploading(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      setUploadStatus({ type: 'error', message: 'Network error occurred: ' + error.message })
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-primary-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-primary-200 to-primary-400 bg-clip-text text-transparent mb-4">
            GitHub Uploader
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Upload files directly to your GitHub repository with our futuristic interface
          </p>
        </div>

        {/* Upload Card */}
        <div className="max-w-2xl mx-auto">
          <div className="glass-effect rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select File (Max 100MB)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="file-input w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-all duration-300"
                  disabled={isUploading}
                />
              </div>

              {/* File Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Custom File Name (Optional)
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter custom name without extension"
                  className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-all duration-300"
                  disabled={isUploading}
                />
              </div>

              {/* Upload Button */}
              <button
                type="submit"
                disabled={isUploading || !file}
                className="w-full py-4 px-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-lg transition-all duration-300 hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed glow-hover relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {isUploading ? (
                    <>
                      <div className="loading-spinner mr-3"></div>
                      Uploading...
                    </>
                  ) : (
                    'Upload to GitHub'
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </form>

            {/* Status Messages */}
            {uploadStatus && (
              <div className={`mt-6 p-4 rounded-lg border ${
                uploadStatus.type === 'success' 
                  ? 'bg-green-500/10 border-green-500/50 text-green-300' 
                  : 'bg-red-500/10 border-red-500/50 text-red-300'
              }`}>
                {uploadStatus.message}
              </div>
            )}

            {/* File URLs */}
            {fileUrls.rawUrl && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                  <p className="text-sm text-gray-300 mb-2">📁 GitHub Raw URL (Direct Link):</p>
                  <a 
                    href={fileUrls.rawUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 break-all underline text-sm"
                  >
                    {fileUrls.rawUrl}
                  </a>
                </div>

                <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                  <p className="text-sm text-gray-300 mb-2">🔗 GitHub File View:</p>
                  <a 
                    href={fileUrls.githubUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 break-all underline text-sm"
                  >
                    {fileUrls.githubUrl}
                  </a>
                </div>

                <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                  <p className="text-sm text-gray-300 mb-2">📝 Commit Details:</p>
                  <a 
                    href={fileUrls.commitUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 break-all underline text-sm"
                  >
                    {fileUrls.commitUrl}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="mt-8 text-center text-gray-400">
            <p className="text-sm">
              Files are uploaded to the <code className="bg-dark-700 px-2 py-1 rounded">uploads/</code> directory in your GitHub repository
            </p>
            <p className="text-sm mt-2">
              Use the <strong>Raw URL</strong> for direct file access in your applications
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}