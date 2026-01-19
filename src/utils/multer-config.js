import multerS3, { AUTO_CONTENT_TYPE } from 'multer-s3'
import { v4 as uuidv4 } from 'uuid'
import { S3_CLIENT } from '../config/aws'

const multer = require('multer')

export const documentMulterConfig = multer({
  storage: multerS3({
    s3: S3_CLIENT,
    contentType: AUTO_CONTENT_TYPE,
    bucket: process.env.BUCKET_NAME,
    acl: 'public-read',
    metadata: function(req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        all: JSON.stringify(file)
      })
    },
    key: function(req, file, cb) {
      cb(null, `${uuidv4()}/original_${Date.now()}`)
    }
  })
})
