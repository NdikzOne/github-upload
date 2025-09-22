export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { file, fileName, originalName, fileType } = req.body

  if (!file) {
    return res.status(400).json({ error: 'No file provided' })
  }

  // Validate environment variables
  const requiredEnvVars = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO']
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingEnvVars.length > 0) {
    return res.status(500).json({ 
      error: `Missing environment variables: ${missingEnvVars.join(', ')}` 
    })
  }

  const {
    GITHUB_TOKEN,
    GITHUB_OWNER,
    GITHUB_REPO,
    GITHUB_BRANCH = 'main'
  } = process.env

  try {
    // Get file extension from original name
    const fileExtension = originalName.includes('.') 
      ? originalName.split('.').pop() 
      : 'bin'
    
    const finalFileName = `${fileName || 'upload'}.${fileExtension}`
    const filePath = `uploads/${finalFileName}`
    
    // Get current SHA of the file if it exists (for updates)
    let currentSha = null
    try {
      const existingFileResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )
      
      if (existingFileResponse.ok) {
        const existingFileData = await existingFileResponse.json()
        currentSha = existingFileData.sha
      }
    } catch (error) {
      // File doesn't exist, which is fine for new uploads
    }

    // Upload file to GitHub
    const uploadResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Upload ${finalFileName}`,
          content: file,
          branch: GITHUB_BRANCH,
          sha: currentSha, // Include SHA for updates, null for new files
        }),
      }
    )

    const uploadResult = await uploadResponse.json()

    if (!uploadResponse.ok) {
      console.error('GitHub API error:', uploadResult)
      return res.status(uploadResponse.status).json({ 
        error: uploadResult.message || 'Failed to upload file to GitHub' 
      })
    }

    const commitUrl = uploadResult.commit.html_url
    const fileUrl = uploadResult.content.html_url

    // Update index.json
    await updateIndexFile({
      GITHUB_TOKEN,
      GITHUB_OWNER,
      GITHUB_REPO,
      GITHUB_BRANCH,
      fileName: finalFileName,
      filePath,
      commitUrl,
      fileUrl,
      fileType,
      originalName,
    })

    return res.status(200).json({
      success: true,
      commitUrl,
      fileUrl,
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({ 
      error: 'Internal server error: ' + error.message 
    })
  }
}

async function updateIndexFile({ 
  GITHUB_TOKEN, 
  GITHUB_OWNER, 
  GITHUB_REPO, 
  GITHUB_BRANCH,
  fileName, 
  filePath, 
  commitUrl, 
  fileUrl,
  fileType,
  originalName 
}) {
  const indexFilePath = 'uploads/index.json'
  
  // Get current index.json content
  let currentIndex = { files: [], lastUpdated: new Date().toISOString() }
  let currentSha = null

  try {
    const indexResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${indexFilePath}?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )

    if (indexResponse.ok) {
      const indexData = await indexResponse.json()
      currentSha = indexData.sha
      const content = Buffer.from(indexData.content, 'base64').toString('utf8')
      currentIndex = JSON.parse(content)
    }
  } catch (error) {
    // File doesn't exist, will create new one
  }

  // Add new file entry
  const newEntry = {
    name: fileName,
    originalName,
    path: filePath,
    type: fileType,
    uploadTime: new Date().toISOString(),
    commitUrl,
    fileUrl,
    size: Math.round(Buffer.from(file, 'base64').length * 0.75) // Approximate size in bytes
  }

  // Remove existing entry if file was updated
  currentIndex.files = currentIndex.files.filter(f => f.path !== filePath)
  currentIndex.files.push(newEntry)
  currentIndex.lastUpdated = new Date().toISOString()

  // Update index.json
  const indexContent = Buffer.from(JSON.stringify(currentIndex, null, 2)).toString('base64')

  const indexUpdateResponse = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${indexFilePath}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update index for ${fileName}`,
        content: indexContent,
        branch: GITHUB_BRANCH,
        sha: currentSha,
      }),
    }
  )

  if (!indexUpdateResponse.ok) {
    const error = await indexUpdateResponse.json()
    throw new Error(`Failed to update index: ${error.message}`)
  }
}