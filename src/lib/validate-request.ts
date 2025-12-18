import { z } from 'zod';
import { NextResponse } from 'next/server';

export async function validateRequest(req: Request, schema: z.ZodObject<any>) {
  try {
    // Clone request agar body bisa dibaca ulang jika perlu
    const body = await req.clone().json();
    
    // Parse menggunakan Zod
    const parsed = await schema.shape.body.parseAsync(body);
    
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        response: NextResponse.json({ message: 'Validation failed', errors: error.issues }, { status: 400 })
      };
    }
    return { 
      success: false, 
      response: NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
    };
  }
}