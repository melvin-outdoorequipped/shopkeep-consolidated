// lib/googleSheets.ts
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';

export const getGoogleSheet = async (spreadsheetId: string) => {
  // Initialize auth with Service Account credentials
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Fixes newline formatting issues in Vercel
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
  
  // Load document properties and worksheets
  await doc.loadInfo(); 
  return doc;
};