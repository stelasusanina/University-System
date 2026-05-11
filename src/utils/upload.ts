import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.ts";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "student-materials",
    resource_type: "raw", // allows PDF, DOCX, PPTX
    allowed_formats: ["pdf", "docx", "pptx"],
  } as object,
});

export const upload = multer({ storage });
