import { EMERGENCY_PHONE } from "@/lib/pets";

// Single place for the NGO's public details. Edit here and every page updates.
export const NGO_NAME = "Rise and Tails";
export const NGO_PHONE = EMERGENCY_PHONE; // TODO: replace with the NGO's real number (in src/lib/pets.ts)
export const NGO_ADDRESS = "Beside Bharat Gas, Hingna Road, Nagpur, Maharashtra";
export const NGO_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(NGO_ADDRESS)}`;
