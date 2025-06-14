const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

export async function createSticker(imagePath) {
    try {
        // Cargar imagen
        const image = sharp(imagePath);
        
        // Redimensionar a 512x512 (tamaño máximo de sticker)
        const resized = await image.resize(512, 512, {
            fit: 'inside',
            withoutEnlargement: true
        });
        
        // Convertir a webp con transparencia
        const buffer = await resized.toFormat('webp', {
            quality: 80,
            lossless: true,
            nearLossless: true,
            effort: 6,
            smartSubsample: true,
            alphaQuality: 100
        }).toBuffer();

        // Guardar sticker
        const stickerPath = path.join(CONFIG.directories.images, 'sticker.webp');
        await fs.writeFile(stickerPath, buffer);
        
        return {
            url: stickerPath,
            type: 'webp'
        };
    } catch (error) {
        console.error('Error al crear sticker:', error);
        throw error;
    }
}
