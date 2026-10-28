/**
 * Favicon Resizer - TypeScript Version
 * 
 * INSTRUCTIONS:
 * 1. Edit the WIDTH and HEIGHT values below
 * 2. Run: npx tsx resize-favicon.ts
 *    OR: node resize-favicon.js (after compiling)
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// EDIT THESE VALUES TO SET YOUR FAVICON SIZE
// ============================================
const WIDTH = 900;   // Change this to your desired width
const HEIGHT = 480;  // Change this to your desired height
// ============================================

const CONFIG = {
    sourceFile: 'albania_favicon.png',
    outputFile: 'albania_favicon.png',
    updateLocations: [
        'src/app/icon.png',
        'public/albania_favicon.png'
    ]
};

async function resizeFavicon() {
    console.log('=========================================');
    console.log('Favicon Resizer');
    console.log('=========================================');
    console.log(`Target dimensions: ${WIDTH}x${HEIGHT}`);
    console.log('');

    try {
        // Check if source file exists
        if (!fs.existsSync(CONFIG.sourceFile)) {
            console.error(`❌ Error: Source file '${CONFIG.sourceFile}' not found!`);
            process.exit(1);
        }

        // Try to use sharp (better quality)
        let sharp;
        try {
            sharp = require('sharp');
        } catch (e) {
            console.error('❌ Sharp library not found.');
            console.log('   Install it with: npm install sharp');
            console.log('   OR use the PowerShell script: .\\resize-favicon.ps1');
            process.exit(1);
        }

        // Get original image info
        const metadata = await sharp(CONFIG.sourceFile).metadata();
        console.log(`Original size: ${metadata.width}x${metadata.height}`);

        // Resize the image with high quality
        await sharp(CONFIG.sourceFile)
            .resize(WIDTH, HEIGHT, {
                fit: 'fill',
                kernel: 'lanczos3'
            })
            .png()
            .toFile(CONFIG.outputFile);

        console.log(`✅ Successfully resized to: ${WIDTH}x${HEIGHT}`);

        // Update favicon files in project
        console.log('');
        console.log('Updating favicon files in project...');

        for (const location of CONFIG.updateLocations) {
            fs.copyFileSync(CONFIG.outputFile, location);
            console.log(`✅ Updated ${location}`);
        }

        console.log('');
        console.log('=========================================');
        console.log('Done! Refresh your browser to see changes.');
        console.log('=========================================');

    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

resizeFavicon();
