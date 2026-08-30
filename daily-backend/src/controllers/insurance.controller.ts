import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import prisma from "../config/db.js";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const DEMO_USER_ID = "user-demo-123";

/**
 * POST /api/insurance/upload
 * Upload insurance document image, parse via Gemini Vision, save to DB,
 * and create proactive reminder 30 days before expiration.
 */
export const uploadInsurance = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({
        success: false,
        error: "No file provided. Send as 'document' field in multipart/form-data.",
      });
      return;
    }

    console.log(`[Insurance] Received document: ${file.originalname} (${file.size} bytes)`);

    // Read the file and prepare for Gemini Vision
    const ext = file.originalname.split(".").pop() || "jpg";
    const filePath = file.path;
    const filePathWithExt = `${filePath}.${ext}`;
    fs.renameSync(filePath, filePathWithExt);

    const fileBuffer = fs.readFileSync(filePathWithExt);
    const base64Data = fileBuffer.toString("base64");

    // Determine MIME type
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      heic: "image/heic",
      heif: "image/heif",
      webp: "image/webp",
      pdf: "application/pdf",
    };
    const mimeType = file.mimetype || mimeMap[ext.toLowerCase()] || "image/jpeg";

    // Parse document via Gemini 1.5 Flash Vision
    console.log("[Insurance] Parsing document with Gemini Vision...");

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `You are an expert Israeli OCR document parser for the 'Daily' personal assistant app.
Analyze the uploaded car insurance document/receipt image and extract the following details into a strict JSON object:

{"providerName": "string or null (e.g., הפניקס, הראל, ביטוח ישיר, ליברה)", "carNumber": "string or null (digits only)", "carModel": "string or null (e.g., מאזדה 3)", "annualCost": number or null, "expirationDate": "ISO 8601 string or null (calculated end-date of policy)"}

CRITICAL: Extract numbers and Hebrew text accurately. Return ONLY a valid JSON object matching the schema above.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const responseText = result.response.text();
    console.log(`[Insurance] Gemini output: ${responseText}`);

    let parsed = {
      providerName: null as string | null,
      carNumber: null as string | null,
      carModel: null as string | null,
      annualCost: null as number | null,
      expirationDate: null as string | null,
    };

    if (responseText) {
      try {
        parsed = JSON.parse(responseText);
        console.log("[Insurance] Parsed successfully:", parsed);
      } catch {
        console.warn("[Insurance] Failed to parse Gemini JSON, saving raw document");
      }
    }

    // Save document to database
    const expirationDate = parsed.expirationDate ? new Date(parsed.expirationDate) : null;

    const document = await prisma.document.create({
      data: {
        userId: DEMO_USER_ID,
        docType: "car_insurance",
        providerName: parsed.providerName,
        fileUrl: filePathWithExt,
        carNumber: parsed.carNumber,
        carModel: parsed.carModel,
        annualCost: parsed.annualCost,
        expirationDate,
      },
    });

    console.log(`[Insurance] Document saved: ${document.id}`);

    // Create proactive reminder 30 days before expiration
    let reminder = null;
    if (expirationDate) {
      const reminderDate = new Date(expirationDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      const carLabel = parsed.carModel || "רכב";

      if (reminderDate > new Date()) {
        reminder = await prisma.reminder.create({
          data: {
            userId: DEMO_USER_ID,
            title: `חידוש ביטוח רכב - ${carLabel}`,
            scheduledTime: reminderDate,
            isProactive: true,
            status: "pending",
          },
        });
        console.log(`[Insurance] Proactive reminder created: ${reminder.id}`);
      }
    }

    // Clean up temp file (keep fileUrl reference for future use)
    // fs.unlink(filePathWithExt, () => {});

    res.status(201).json({
      success: true,
      data: { document, reminder },
    });
  } catch (error) {
    console.error("[Insurance] uploadInsurance error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during insurance upload.",
    });
  }
};

/**
 * GET /api/insurance/compare/:documentId
 * Retrieve document, calculate government baseline rate, and return comparison.
 */
export const compareInsurance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      res.status(404).json({ success: false, error: "Document not found." });
      return;
    }

    // Government compulsory insurance baseline rate calculation
    // Based on Israeli average (~1,100-1,300 NIS)
    const baseAge = document.driverAge || 30;
    const noClaimsDiscount = (document.noClaimsYears || 3) * 50;
    const governmentCompulsoryRate = Math.round(1200 - noClaimsDiscount + (baseAge < 24 ? 300 : 0));

    const currentCost = document.annualCost || 0;
    const estimatedSavings = currentCost > governmentCompulsoryRate
      ? Math.round(currentCost * 0.13)
      : 0;

    // Build Bestie deep link with pre-filled vehicle params
    const bestieParams = new URLSearchParams();
    if (document.carNumber) bestieParams.set("carNumber", document.carNumber);
    if (document.carModel) bestieParams.set("carModel", document.carModel);
    const bestieDeepLink = `https://www.bestie.co.il/?${bestieParams.toString()}`;

    res.status(200).json({
      success: true,
      data: {
        currentPolicy: {
          provider: document.providerName || "לא ידוע",
          cost: currentCost,
          expirationDate: document.expirationDate?.toISOString() || null,
          carModel: document.carModel,
          carNumber: document.carNumber,
        },
        governmentCompulsoryRate,
        estimatedSavings,
        bestieDeepLink,
      },
    });
  } catch (error) {
    console.error("[Insurance] compareInsurance error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during insurance comparison.",
    });
  }
};

/**
 * GET /api/insurance/documents
 * Get all insurance documents for the current user.
 */
export const getDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.query.userId as string) || DEMO_USER_ID;

    const documents = await prisma.document.findMany({
      where: { userId, docType: "car_insurance" },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error("[Insurance] getDocuments error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while fetching documents.",
    });
  }
};

/**
 * PATCH /api/insurance/documents/:id
 * Update parsed document fields (user correction after AI parsing).
 */
export const updateDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { providerName, carNumber, carModel, annualCost, expirationDate, driverAge, noClaimsYears } = req.body;

    const data: Record<string, unknown> = {};
    if (providerName !== undefined) data.providerName = providerName;
    if (carNumber !== undefined) data.carNumber = carNumber;
    if (carModel !== undefined) data.carModel = carModel;
    if (driverAge !== undefined) data.driverAge = driverAge;
    if (noClaimsYears !== undefined) data.noClaimsYears = noClaimsYears;
    if (annualCost !== undefined) data.annualCost = annualCost;
    if (expirationDate !== undefined) {
      data.expirationDate = expirationDate ? new Date(expirationDate) : null;
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({ success: false, error: "No fields to update." });
      return;
    }

    const document = await prisma.document.update({
      where: { id },
      data,
    });

    res.status(200).json({ success: true, data: document });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      res.status(404).json({ success: false, error: "Document not found." });
      return;
    }
    console.error("[Insurance] updateDocument error:", error);
    res.status(500).json({ success: false, error: "Internal server error." });
  }
};

/**
 * GET /api/insurance/documents/:id/file
 * Serve the uploaded document file for viewing.
 */
export const serveDocumentFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document || !document.fileUrl) {
      res.status(404).json({ success: false, error: "File not found." });
      return;
    }

    // Determine content type from file extension
    const ext = document.fileUrl.split(".").pop()?.toLowerCase() || "jpg";
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      heic: "image/heic", webp: "image/webp", pdf: "application/pdf",
    };

    res.setHeader("Content-Type", mimeMap[ext] || "application/octet-stream");
    res.sendFile(document.fileUrl, { root: "." });
  } catch (error) {
    console.error("[Insurance] serveDocumentFile error:", error);
    res.status(500).json({ success: false, error: "Internal server error." });
  }
};
