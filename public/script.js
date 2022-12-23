const videoUrl = localStorage.getItem('url')
const downloadVideo = $('#download-video')

$('#remove-video').on('click', () => {
  if (confirm('Are you sure?')) {
    downloadVideo.attr('src', '')
    localStorage.removeItem('url')
  }
})

if (videoUrl) {
  downloadVideo.attr('src', videoUrl)
}

$('#download-form').on('submit', async (e) => {
  e.preventDefault()

  const element = $(e.target)
  const val = element.find('input:first').val().trim()

  try {
    const response = await fetch(`/downloadInfo?url=${val}`)
    const data = await response.json()
    const videoUrl = data.videoUrl

    if (!response.ok) throw new Error('Probally invalid url.')

    downloadVideo.attr('src', videoUrl)

    localStorage.setItem('url', videoUrl)
  } catch (e) {
    console.error(e)
    alert('there was an error.')
  }
})
