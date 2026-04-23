import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { brandConfigs } from '../../../config/brandConfig';
import { getGoogleSheet } from '../../../lib/googleSheets';

// Helper function to get value or return dash
const getValueOrDash = (value: any): string => {
  const cleaned = value?.toString().trim();
  return cleaned && cleaned !== '' ? cleaned : '-';
};

// Helper function to safely get column value
const getSafeColumnValue = (row: any, columnName: string | undefined): string => {
  if (!columnName) return '-';
  return getValueOrDash(row.get(columnName));
};

export async function POST(req: Request) {
  try {
    const { skus } = await req.json();
    
    // Split by newline, trim, and remove empty lines (supports both \n and \r\n)
    const skuArray = skus.split(/\r?\n/)
      .map((sku: string) => sku.trim())
      .filter(Boolean); // removes empty strings

    if (skuArray.length === 0) {
      return NextResponse.json({ error: 'No SKUs provided' }, { status: 400 });
    }

    const consolidatedData: any[] = [];
    const brandsFound = new Set<string>();

    // Loop through each brand configuration
    for (const config of brandConfigs) {
      try {
        const doc = await getGoogleSheet(config.spreadsheetId);
        
        // Grab the specific sheet - fix the type safety issue
        const sheet = doc.sheetsByTitle[config.sheetName as string] || doc.sheetsByIndex[0];
        
        if (!sheet) {
          console.error(`No sheet found for ${config.brandName}`);
          continue;
        }
        
        const rows = await sheet.getRows();

        // Check each row in the Google Sheet against the user's requested SKUs
        for (const row of rows) {
          const rowSku = row.get(config.columns.sku)?.toString().trim();
          
          if (rowSku && skuArray.includes(rowSku)) {
            // Track which brands we found results for
            if (config.brandName) {
              brandsFound.add(config.brandName);
            }
            
            // Build the data object with all fields using safe column access
            const dataRow: any = {
              Brand: config.brandName || 'Unknown Brand', // Provide a fallback
              SKU: rowSku,
              UPC: getSafeColumnValue(row, config.columns.upc),
              Shopkeep_Name: getSafeColumnValue(row, config.columns.name),
              Style_Number: getSafeColumnValue(row, config.columns.style_number),
              Description: getSafeColumnValue(row, config.columns.description),
              Color: getSafeColumnValue(row, config.columns.color),
              Color_Code: getSafeColumnValue(row, config.columns.color_code),
              Size: getSafeColumnValue(row, config.columns.size),
              Gender: getSafeColumnValue(row, config.columns.gender),
            };

            consolidatedData.push(dataRow);
          }
        }
      } catch (sheetError) {
         console.error(`Failed to process sheet for ${config.brandName}:`, sheetError);
      }
    }

    // Generate filename based on brands found
    let filename = 'Consolidated_SKUs.xlsx';
    const date = new Date().toISOString().split('T')[0];
    
    if (consolidatedData.length === 0) {
       consolidatedData.push({ 
         Brand: "No matches found", 
         SKU: "-", 
         UPC: "-", 
         Shopkeep_Name: "-",
         Style_Number: "-",
         Description: "-",
         Color: "-",
         Color_Code: "-",
         Size: "-",
         Gender: "-"
       });
    } else {
      // Build filename with brands found
      const brandsList = Array.from(brandsFound).join('_');
      filename = `${brandsList}_SKUs_${date}.xlsx`;
    }

    // Create Excel workbook
    const worksheet = xlsx.utils.json_to_sheet(consolidatedData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Consolidated SKUs");

    // Generate buffer
    const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return the file as a downloadable response
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Failed to process SKUs' }, { status: 500 });
  }
}