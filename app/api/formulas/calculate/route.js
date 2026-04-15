import { NextResponse } from 'next/server';
import { runProprietaryAnalysis } from '../../../../lib/formulas';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = runProprietaryAnalysis(body);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Formula calculation failed.' },
      { status: 400 }
    );
  }
}
