// Maps product SKUs to Stripe Price IDs (set in Vercel environment variables)
// Format: STRIPE_PRICE_SSC_WHS_RA_001 = price_xxx
export const SKU_TO_STRIPE_PRICE: Record<string, string> = {};

export const SKU_TO_FILE_KEYS: Record<string, string[]> = {
  'SSC-WHS-RA-001':    ['products/whs/SSC-WHS-RA-001.docx',    'products/whs/SSC-WHS-RA-001.xlsx'],
  'SSC-WHS-SWMS-002':  ['products/whs/SSC-WHS-SWMS-002.docx',  'products/whs/SSC-WHS-SWMS-002.xlsx'],
  'SSC-WHS-JSA-003':   ['products/whs/SSC-WHS-JSA-003.docx',   'products/whs/SSC-WHS-JSA-003.xlsx'],
  'SSC-WHS-SOP-004':   ['products/whs/SSC-WHS-SOP-004.docx'],
  'SSC-WHS-TBT-005':   ['products/whs/SSC-WHS-TBT-005.docx',   'products/whs/SSC-WHS-TBT-005.xlsx'],
  'SSC-WHS-JMP-006':   ['products/whs/SSC-WHS-JMP-006.docx'],
  'SSC-WHS-PMC-007':   ['products/whs/SSC-WHS-PMC-007.docx',   'products/whs/SSC-WHS-PMC-007.xlsx'],
  'SSC-WHS-AUD-008':   ['products/whs/SSC-WHS-AUD-008.docx',   'products/whs/SSC-WHS-AUD-008.xlsx'],
  'SSC-RCA-INC-001':   ['products/rca/SSC-RCA-INC-001.docx',   'products/rca/SSC-RCA-INC-001.xlsx'],
  'SSC-RCA-MST-002':   ['products/rca/SSC-RCA-MST-002.docx'],
  'SSC-RCA-5WHY-003':  ['products/rca/SSC-RCA-5WHY-003.docx'],
  'SSC-RCA-PEEPO-004': ['products/rca/SSC-RCA-PEEPO-004.docx'],
  'SSC-RCA-FISH-005':  ['products/rca/SSC-RCA-FISH-005.docx'],
  'SSC-RCA-CAR-006':   ['products/rca/SSC-RCA-CAR-006.xlsx'],
  'SSC-BND-WHS-001':   ['bundles/SSC-BND-WHS-001.zip'],
  'SSC-BND-ENV-002':   ['bundles/SSC-BND-ENV-002.zip'],
  'SSC-BND-IMS-003':   ['bundles/SSC-BND-IMS-003.zip'],
};

export const SKU_TO_PRICE_CENTS: Record<string, number> = {
  'SSC-WHS-RA-001': 499, 'SSC-WHS-SWMS-002': 499, 'SSC-WHS-JSA-003': 499,
  'SSC-WHS-SOP-004': 499, 'SSC-WHS-TBT-005': 499, 'SSC-WHS-JMP-006': 499,
  'SSC-WHS-PMC-007': 499, 'SSC-WHS-AUD-008': 499,
  'SSC-RCA-INC-001': 499, 'SSC-RCA-MST-002': 1200, 'SSC-RCA-5WHY-003': 499,
  'SSC-RCA-PEEPO-004': 499, 'SSC-RCA-FISH-005': 499, 'SSC-RCA-CAR-006': 1200,
  'SSC-BND-WHS-001': 6050, 'SSC-BND-ENV-002': 6050, 'SSC-BND-IMS-003': 9900,
};
