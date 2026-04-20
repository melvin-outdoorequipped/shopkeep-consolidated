import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { brandConfigs } from '../../../config/brandConfig';
import { getGoogleSheet } from '../../../lib/googleSheets';

// Helper function to get value or return dash
const getValueOrDash = (value: any): string => {
  const cleaned = value?.toString().trim();
  return cleaned && cleaned !== '' ? cleaned : '-';
};

export async function POST(req: Request) {
  try {
    const { upcs } = await req.json();
    
    // Split by newline, trim, and remove empty lines (supports both \n and \r\n)
    const upcArray = upcs.split(/\r?\n/)
      .map((upc: string) => upc.trim())
      .filter(Boolean); // removes empty strings

    if (upcArray.length === 0) {
      return NextResponse.json({ error: 'No UPCs provided' }, { status: 400 });
    }

    const consolidatedData: any[] = [];

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

        // Check each row in the Google Sheet against the user's requested UPCs
        for (const row of rows) {
          const rowUpc = row.get(config.columns.upc)?.toString().trim();
          
          if (rowUpc && upcArray.includes(rowUpc)) {
            // Build the data object with all fields using getValueOrDash
            const dataRow: any = {
              Brand: config.brandName,
              UPC: rowUpc,
              SKU: getValueOrDash(row.get(config.columns.sku)),
              Shopkeep_Name: getValueOrDash(row.get(config.columns.name)),
            };

            // Add optional fields if they exist in the config and have column names
            if (config.columns.style_number && config.columns.style_number !== '') {
              dataRow.Style_Number = getValueOrDash(row.get(config.columns.style_number));
            } else {
              dataRow.Style_Number = '-';
            }
            
            if (config.columns.description && config.columns.description !== '') {
              dataRow.Description = getValueOrDash(row.get(config.columns.description));
            } else {
              dataRow.Description = '-';
            }
            
            if (config.columns.color && config.columns.color !== '') {
              dataRow.Color = getValueOrDash(row.get(config.columns.color));
            } else {
              dataRow.Color = '-';
            }

            if (config.columns.color_code && config.columns.color_code !== '') {
              dataRow.Color_Code = getValueOrDash(row.get(config.columns.color_code));
            } else {
              dataRow.Color_Code = '-';
            }
            
            if (config.columns.size && config.columns.size !== '') {
              dataRow.Size = getValueOrDash(row.get(config.columns.size));
            } else {
              dataRow.Size = '-';
            }

            if (config.columns.gender && config.columns.gender !== '') {
              dataRow.Gender = getValueOrDash(row.get(config.columns.gender));
            } else {
              dataRow.Gender = '-';
            }

            consolidatedData.push(dataRow);
          }
        }
      } catch (sheetError) {
         console.error(`Failed to process sheet for ${config.brandName}:`, sheetError);
      }
    }

    // Handle edge case: No matches found across any sheet
    if (consolidatedData.length === 0) {
       consolidatedData.push({ 
         Brand: "No matches found", 
         UPC: "-", 
         SKU: "-", 
         Shopkeep_Name: "-",
         Style_Number: "-",
         Description: "-",
         Color: "-",
         Color_Code: "-",
         Size: "-",
         Gender: "-"
       });
    }

    // Create Excel workbook
    const worksheet = xlsx.utils.json_to_sheet(consolidatedData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Consolidated UPCs");

    // Generate buffer
    const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return the file as a downloadable response
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="Consolidated_UPCs.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Failed to process UPCs' }, { status: 500 });
  }
}