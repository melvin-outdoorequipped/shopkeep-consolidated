import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { pairs } = await req.json(); // Expected: [{style: "...", asin: "..."}, ...]
    
    const styleMap = new Map<string, Set<string>>();

    // Group ASINs by Style
    pairs.forEach(({ style, asin }: { style: string, asin: string }) => {
      const s = style?.trim().toUpperCase();
      const a = asin?.trim();
      if (!s || !a) return;

      if (!styleMap.has(s)) styleMap.set(s, new Set());
      styleMap.get(s)!.add(a);
    });

    // Filter to only those with > 1 unique ASIN
    const conflicts = [];
    for (const [style, asins] of styleMap.entries()) {
      if (asins.size > 1) {
        conflicts.push({ style, asins: Array.from(asins) });
      }
    }

    return NextResponse.json({ conflicts });
  } catch (error) {
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}