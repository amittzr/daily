import { Router } from "express";
import multer from "multer";
import {
  uploadInsurance,
  compareInsurance,
  getDocuments,
  updateDocument,
  serveDocumentFile,
} from "../controllers/insurance.controller.js";

const router = Router();

// Configure multer for document uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/heic", "image/heif",
      "image/webp", "application/pdf",
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(jpg|jpeg|png|heic|heif|webp|pdf)$/i)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file format: ${file.mimetype}`));
    }
  },
});

// POST /api/insurance/upload — Upload insurance document for AI parsing
router.post("/upload", upload.single("document"), uploadInsurance);

// PATCH /api/insurance/documents/:id — Update parsed document fields
router.patch("/documents/:id", updateDocument);

// GET /api/insurance/documents/:id/file — Serve the uploaded file
router.get("/documents/:id/file", serveDocumentFile);

// GET /api/insurance/compare/:documentId — Get comparison data
router.get("/compare/:documentId", compareInsurance);

// GET /api/insurance/documents — Get all insurance documents for user
router.get("/documents", getDocuments);

export default router;
