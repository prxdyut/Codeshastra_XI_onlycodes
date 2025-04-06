import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'uploads');
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const filename = `${uniqueSuffix}-${file.name}`;
        const filePath = join(uploadsDir, filename);

        // Convert File to Buffer and write to filesystem
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Return the relative path for future reference
        return NextResponse.json({ 
            filePath: `uploads/${filename}`,
            message: 'File uploaded successfully' 
        });
    } catch (error: any) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: 'Error uploading file', details: error.message },
            { status: 500 }
        );
    }
} 