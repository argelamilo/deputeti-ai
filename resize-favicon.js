/**
 * Favicon Resizer Script (Node.js version)
 * This script allows you to manually set the width and height of the favicon
 * 
 * Usage: node resize-favicon.js [width] [height]
 * Example: node resize-favicon.js 800 500
 */

const fs = require('fs');
const path = require('path');

// Configuration - Edit these values to set custom dimensions
const CONFIG = {
    width: 900,      // Set your desired width here
    height: 480,     // Set your desired height here
    sourceFile: 'albania_favicon.png',
    outputFile: 'albania_favicon.png'
};

// Get dimensions from command line arguments if provided
const args = process.argv.slice(2);
if (args.length >= 1) CONFIG.width = parseInt(args[0]) || CONFIG.width;
if (args.length >= 2) CONFIG.height = parseInt(args[1]) || CONFIG.height;

console.log('=========================================');
console.log('Favicon Resizer');
console.log('=========================================');
console.log(`Source: ${CONFIG.sourceFile}`);
console.log(`Target dimensions: ${CONFIG.width}x${CONFIG.height}`);
console.log('');

// Check if sharp is available (better image processing)
let sharp;
try {
    sharp = require('sharp');
} catch (e) {
    console.log('⚠️  Sharp not found. Installing sharp...');
    console.log('   Run: npm install sharp');
    console.log('');
    console.log('Alternatively, use the PowerShell script: resize-favicon.ps1');
    process.exit(1);
}

async function resizeFavicon() {
    try {
        // Check if source file exists
        if (!fs.existsSync(CONFIG.sourceFile)) {
            console.error(`❌ Error: Source file '${CONFIG.sourceFile}' not found!`);
            process.exit(1);
        }

        // Get original image info
        const metadata = await sharp(CONFIG.sourceFile).metadata();
        console.log(`Original size: ${metadata.width}x${metadata.height}`);

        // Resize the image
        await sharp(CONFIG.sourceFile)
            .resize(CONFIG.width, CONFIG.height, {
                fit: 'fill',
                kernel: 'lanczos3'
            })
            .png()
            .toFile(CONFIG.outputFile);

        console.log(`✅ Successfully resized to: ${CONFIG.width}x${CONFIG.height}`);

        // Update favicon files in project
        console.log('');
        console.log('Updating favicon files in project...');

        fs.copyFileSync(CONFIG.outputFile, 'src/app/icon.png');
        fs.copyFileSync(CONFIG.outputFile, 'public/albania_favicon.png');

        console.log('✅ Updated src/app/icon.png');
        console.log('✅ Updated public/albania_favicon.png');
        console.log('');
        console.log('=========================================');
        console.log('Done! Refresh your browser to see changes.');
        console.log('=========================================');

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

resizeFavicon();
