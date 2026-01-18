export const uploadDocuments = async (req, res) => {
  let metadata = null // use store the metadata of the uploaded file
  console.log('Uploaded')
  // if the multer config has multiple files, then req.files is an array
  if (req.files) {
    metadata = req.files.map(function(file) {
      return {
        name: file.key,
        type: file.mimetype,
        size: file.size
      }
    })
  }

  // if the multer config has single files, then req.files is an array
  if (req.file) {
    metadata = {
      name: req.file.key,
      type: req.file.mimetype,
      size: req.file.size
    }
  }

  res.send({
    message: 'UPLOADED',
    metadata
  })
}
