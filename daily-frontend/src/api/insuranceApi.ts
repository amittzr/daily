import { Platform } from "react-native";
import { API_BASE_URL } from "../config/constants";

const API_INSURANCE_URL = `${API_BASE_URL}/api/insurance`;

export interface InsuranceDocument {
  id: string;
  userId: string;
  docType: string;
  providerName: string | null;
  carNumber: string | null;
  carModel: string | null;
  driverAge: number | null;
  noClaimsYears: number | null;
  annualCost: number | null;
  expirationDate: string | null;
  createdAt: string;
}

export interface CarrierRate {
  companyName: string;
  price: number;
  logoUrl: string;
  companyUrl: string;
}

export interface InsuranceComparison {
  currentPolicy: {
    providerName: string;
    annualCost: number;
    expirationDate: string | null;
    carModel: string | null;
    carNumber: string | null;
  };
  top5Rates: CarrierRate[];
  cheapestPrice: number;
  estimatedSavings: number;
  bestieDeepLink: string;
}

/**
 * Upload an insurance document image for AI parsing.
 */
export async function uploadInsuranceDocument(imageUri: string): Promise<InsuranceDocument> {
  const formData = new FormData();

  if (Platform.OS === "web") {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    formData.append("document", blob, "insurance.jpg");
  } else {
    const fileExtension = imageUri.split(".").pop() || "jpg";
    formData.append("document", {
      uri: imageUri,
      type: `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`,
      name: `insurance.${fileExtension}`,
    } as unknown as Blob);
  }

  const response = await fetch(`${API_INSURANCE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || `Server error ${response.status}`);
  }

  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || "Unknown error");
  }

  return result.data;
}

/**
 * Get insurance comparison data for a specific document.
 */
export async function getInsuranceComparison(documentId: string): Promise<InsuranceComparison> {
  const response = await fetch(`${API_INSURANCE_URL}/compare/${documentId}`);

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || `Server error ${response.status}`);
  }

  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || "Unknown error");
  }

  return result.data;
}

/**
 * On-demand insurance comparison — pass a documentId or manual params.
 */
export async function compareOnDemand(params: {
  documentId?: string;
  driverAge?: number;
  noClaimsYears?: number;
  carModel?: string;
  carNumber?: string;
  annualCost?: number;
}): Promise<InsuranceComparison> {
  const response = await fetch(`${API_INSURANCE_URL}/compare-on-demand`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || `Server error ${response.status}`);
  }

  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || "Unknown error");
  }

  return result.data;
}

/**
 * Get all insurance documents for the current user.
 */
export async function getInsuranceDocuments(): Promise<InsuranceDocument[]> {
  const response = await fetch(`${API_INSURANCE_URL}/documents`);

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || `Server error ${response.status}`);
  }

  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || "Unknown error");
  }

  return result.data;
}

/**
 * Update parsed document fields (user correction).
 */
export async function updateInsuranceDocument(
  id: string,
  updates: Partial<Pick<InsuranceDocument, "providerName" | "carNumber" | "carModel" | "annualCost" | "expirationDate" | "driverAge" | "noClaimsYears">>
): Promise<InsuranceDocument> {
  const response = await fetch(`${API_INSURANCE_URL}/documents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || `Server error ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get the file URL for viewing the uploaded document.
 */
export function getDocumentFileUrl(documentId: string): string {
  return `${API_INSURANCE_URL}/documents/${documentId}/file`;
}
