// lib/googleSheets.ts
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Initialize auth - use service account
const getAuth = () => {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    return serviceAccountAuth;
  } catch (error) {
    console.error('Failed to create Google Auth:', error);
    throw error;
  }
};

export async function getGoogleSheet(spreadsheetId: string) {
  try {
    const auth = getAuth();
    const doc = new GoogleSpreadsheet(spreadsheetId, auth);
    
    // Load document properties and worksheets
    await doc.loadInfo();
    
    return doc;
  } catch (error: any) {
    console.error(`Error loading Google Sheet ${spreadsheetId}:`, error.message);
    
    // Provide more helpful error message
    if (error.message?.includes('403')) {
      throw new Error(`Permission denied for spreadsheet. Please share the sheet with your service account email.`);
    }
    
    throw error;
  }
}