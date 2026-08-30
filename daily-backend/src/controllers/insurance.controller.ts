import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import prisma from "../config/db.js";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const DEMO_USER_ID = "user-demo-123";

// Israeli car insurance carrier catalog with logo URLs + official websites
const CARRIERS = [
  { companyName: "WeSure", logoUrl: "https://car.cma.gov.il/Images/Logos/wesure.png", website: "https://www.wesure.co.il", base: 2264 },
  { companyName: "איילון", logoUrl: "https://car.cma.gov.il/Images/Logos/ayalon.png", website: "https://www.ayalon-ins.co.il", base: 2311 },
  { companyName: "שומרה", logoUrl: "https://car.cma.gov.il/Images/Logos/shomera.png", website: "https://www.shomera.co.il", base: 2330 },
  { companyName: "מגדל", logoUrl: "https://car.cma.gov.il/Images/Logos/migdal.png", website: "https://www.migdal.co.il", base: 2337 },
  { companyName: "ביטוח חקלאי", logoUrl: "https://car.cma.gov.il/Images/Logos/biklay.png", website: "https://www.bth.co.il", base: 2344 },
  { companyName: "הפניקס", logoUrl: "https://car.cma.gov.il/Images/Logos/phoenix.png", website: "https://www.fnx.co.il", base: 2410 },
  { companyName: "הראל", logoUrl: "https://car.cma.gov.il/Images/Logos/harel.png", website: "https://www.harel-group.co.il", base: 2455 },
  { companyName: "כלל", logoUrl: "https://car.cma.gov.il/Images/Logos/clal.png", website: "https://www.clalbit.co.il", base: 2490 },
  { companyName: "ליברה", logoUrl: "https://car.cma.gov.il/Images/Logos/libra.png", website: "https://www.libra.co.il", base: 2520 },
  { companyName: "א.י.ג", logoUrl: "https://car.cma.gov.il/Images/Logos/aig.png", website: "https://www.aig.co.il", base: 2575 },
];

interface CarrierRate {
  companyName: string;
  price: number;
  logoUrl: string;
  companyUrl: string;
}

interface RateParams {
  driverAge?: number | null;
  noClaimsYears?: number | null;
  carModel?: string | null;
  carNumber?: string | null;
}

/**
 * Fetch government compulsory insurance rates for all carriers.
 * Attempts the official CMA calculator API; falls back to a calculated
 * estimate based on driver/vehicle params if the live API is unavailable.
 * Returns the TOP 5 cheapest carriers sorted ascending by price.
 */
async function fetchGovernmentCompulsoryRates(params: RateParams): Promise<CarrierRate[]> {
  const age = params.driverAge || 30;
  const noClaims = params.noClaimsYears ?? 3;

  // Attempt the official CMA government calculator API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("https://car.cma.gov.il/api/Calculator/Calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driverAge: age,
        noClaimsYears: noClaims,
        licensePlate: params.carNumber || "",
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = (await response.json()) as { companies?: Array<{ name: string; premium: number; logo?: string; url?: string }> };
      // Expected shape: { companies: [{ name, premium, logo }] }
      if (Array.isArray(data?.companies) && data.companies.length > 0) {
        const rates: CarrierRate[] = data.companies
          .map((c: { name: string; premium: number; logo?: string; url?: string }) => {
            // Match against known carriers for website fallback
            const known = CARRIERS.find((k) => c.name?.includes(k.companyName) || k.companyName.includes(c.name));
            return {
              companyName: c.name,
              price: Math.round(c.premium),
              logoUrl: c.logo || known?.logoUrl || "",
              companyUrl: c.url || known?.website || "",
            };
          })
          .sort((a: CarrierRate, b: CarrierRate) => a.price - b.price);
        return rates.slice(0, 5);
      }
    }
    console.warn("[Insurance] CMA API returned unexpected data, using fallback");
  } catch (err) {
    console.warn("[Insurance] CMA API unavailable, using calculated fallback:", (err as Error).message);
  }

  // Fallback: calculate estimated rates per carrier based on driver profile
  const ageAdjustment = age < 24 ? 350 : age > 60 ? 150 : 0;
  const noClaimsDiscount = Math.min(noClaims, 9) * 45;

  const rates: CarrierRate[] = CARRIERS.map((carrier) => ({
    companyName: carrier.companyName,
    price: Math.max(1100, Math.round(carrier.base + ageAdjustment - noClaimsDiscount)),
    logoUrl: carrier.logoUrl,
    companyUrl: carrier.website,
  })).sort((a, b) => a.price - b.price);

  return rates.slice(0, 5);
}

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
    const documentId = String(req.params.documentId);

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      res.status(404).json({ success: false, error: "Document not found." });
      return;
    }

    // Fetch top 5 cheapest government compulsory rates
    const top5Rates = await fetchGovernmentCompulsoryRates({
      driverAge: document.driverAge,
      noClaimsYears: document.noClaimsYears,
      carModel: document.carModel,
      carNumber: document.carNumber,
    });

    const cheapestPrice = top5Rates.length > 0 ? top5Rates[0].price : 0;
    const currentCost = document.annualCost || 0;
    const estimatedSavings = currentCost > cheapestPrice ? currentCost - cheapestPrice : 0;

    // Build Bestie deep link with pre-filled vehicle params
    const bestieParams = new URLSearchParams();
    if (document.carNumber) bestieParams.set("carNumber", document.carNumber);
    if (document.carModel) bestieParams.set("carModel", document.carModel);
    const bestieDeepLink = `https://www.bestie.co.il/?${bestieParams.toString()}`;

    res.status(200).json({
      success: true,
      data: {
        currentPolicy: {
          providerName: document.providerName || "לא ידוע",
          annualCost: currentCost,
          expirationDate: document.expirationDate?.toISOString() || null,
          carModel: document.carModel,
          carNumber: document.carNumber,
        },
        top5Rates,
        cheapestPrice,
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
 * POST /api/insurance/compare-on-demand
 * On-demand comparison: either pass an existing documentId, or pass
 * driver/vehicle params directly. Returns top 5 rates.
 */
export const compareOnDemand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId, driverAge, noClaimsYears, carModel, carNumber, annualCost } = req.body;

    let params: RateParams = { driverAge, noClaimsYears, carModel, carNumber };
    let currentPolicy = {
      providerName: "לא ידוע",
      annualCost: annualCost || 0,
      expirationDate: null as string | null,
      carModel: carModel || null,
      carNumber: carNumber || null,
    };

    // If documentId provided, use its stored params
    if (documentId) {
      const document = await prisma.document.findUnique({ where: { id: documentId } });
      if (document) {
        params = {
          driverAge: document.driverAge,
          noClaimsYears: document.noClaimsYears,
          carModel: document.carModel,
          carNumber: document.carNumber,
        };
        currentPolicy = {
          providerName: document.providerName || "לא ידוע",
          annualCost: document.annualCost || 0,
          expirationDate: document.expirationDate?.toISOString() || null,
          carModel: document.carModel,
          carNumber: document.carNumber,
        };
      }
    }

    const top5Rates = await fetchGovernmentCompulsoryRates(params);
    const cheapestPrice = top5Rates.length > 0 ? top5Rates[0].price : 0;
    const currentCost = currentPolicy.annualCost;
    const estimatedSavings = currentCost > cheapestPrice ? currentCost - cheapestPrice : 0;

    const bestieParams = new URLSearchParams();
    if (params.carNumber) bestieParams.set("carNumber", params.carNumber);
    if (params.carModel) bestieParams.set("carModel", params.carModel);
    const bestieDeepLink = `https://www.bestie.co.il/?${bestieParams.toString()}`;

    res.status(200).json({
      success: true,
      data: {
        currentPolicy,
        top5Rates,
        cheapestPrice,
        estimatedSavings,
        bestieDeepLink,
      },
    });
  } catch (error) {
    console.error("[Insurance] compareOnDemand error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during on-demand comparison.",
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
    const id = String(req.params.id);
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
    const id = String(req.params.id);

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
