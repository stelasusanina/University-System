import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.ts";

const ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "pptx"]);

const storage = new CloudinaryStorage({
  cloudinary,
  params: ((_req: unknown, file: Express.Multer.File) => {
    const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "";
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      folder: "student-materials",
      resource_type: "raw",
      public_id: `${uid}.${ext}`,
    };
  }) as object,
});

export const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "";
    if (ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOCX and PPTX files are allowed"));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});
