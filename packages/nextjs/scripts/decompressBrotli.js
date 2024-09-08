const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const util = require('util');

const brotliDecompress = util.promisify(zlib.brotliDecompress);

const unityBuildPath = path.resolve(__dirname, '../public/UnityGame/Build');

console.log('Unity Build Path:', unityBuildPath);

async function decompressFile(filePath) {
    try {
        const compressedData = await fs.promises.readFile(filePath);
        const decompressedData = await brotliDecompress(compressedData);
        const outputPath = filePath.slice(0, -3); // Remove .br extension
        await fs.promises.writeFile(outputPath, decompressedData);
        console.log(`Decompressed: ${path.basename(filePath)}`);

        // Optionally, remove the .br file after decompression
        // await fs.promises.unlink(filePath);
    } catch (error) {
        console.error(`Error decompressing ${filePath}:`, error);
    }
}

async function decompressFiles() {
    const files = await fs.promises.readdir(unityBuildPath);
    const decompressPromises = files
        .filter(file => file.endsWith('.br'))
        .map(file => decompressFile(path.join(unityBuildPath, file)));

    await Promise.all(decompressPromises);
}

decompressFiles().then(() => {
    console.log('Decompression complete');
}).catch(error => {
    console.error('Error during decompression:', error);
});