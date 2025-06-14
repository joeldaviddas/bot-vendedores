import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';

export async function createSticker(imagePath) {
    try {
        // Verificar si la imagen existe
        if (!await fs.pathExists(imagePath)) {
            throw new Error('La imagen no existe en el sistema.');
        }

        // Verificar si es un archivo válido
        const stats = await fs.stat(imagePath);
        if (!stats.isFile()) {
            throw new Error('El camino especificado no es un archivo válido.');
        }

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

        // Crear directorio de imágenes si no existe
        const imagesDir = path.resolve(__dirname, '..', '..', CONFIG.directories.images);
        await fs.ensureDir(imagesDir);

        // Generar nombre único para el sticker
        const timestamp = Date.now();
        const stickerPath = path.join(imagesDir, `sticker_${timestamp}.webp`);
        
        // Guardar sticker
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
