import cloudinaryModule from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

const cloudinary = cloudinaryModule.v2;

cloudinary.config({
    cloud_name: "diytyjnla",
    api_key: "555319435542324",
    api_secret: "jv1VUCLK8c7P_kpyuv4h_pxeomc",
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const rawMimeTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel (.xlsx)
            'application/vnd.ms-excel', // Old Excel format (.xls)
            'application/msword', // Word (.doc)
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word (.docx)
            'text/csv' // CSV (.csv)
        ];

        const isRawFile = rawMimeTypes.includes(file.mimetype);

        return {
            folder: 'template_uploads',
            resource_type: isRawFile ? 'raw' : 'auto', // Store as 'raw' for non-images
            format: file.originalname.split('.').pop(), // Keep original file extension
            public_id: file.originalname.split('.').slice(0, -1).join('.'), // Preserve original filename
            use_filename: true,
            unique_filename: false, // Prevent Cloudinary from appending random characters
        };

    },
});

const upload = multer({ storage });

export { upload, cloudinary };
