import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export class ImageService {
    /**
     * Comprime y redimensiona una imagen para optimizar el rendimiento y 
     * cumplir con los límites de las redes sociales.
     * @param inputBuffer El buffer de la imagen original
     * @param originalName El nombre original del archivo
     * @returns Un nuevo buffer optimizado
     */
    static async optimizeImage(inputBuffer: Buffer, originalName: string): Promise<{ buffer: Buffer; mimetype: string }> {
        try {
            console.log(`[ImageService] Optimizando imagen: ${originalName}`);
            
            // 1. Redimensionar para evitar que sea muy pesada (max 1920x1920)
            // 2. Convertir a JPEG con calidad 80 (óptimo para redes)
            const optimizedBuffer = await sharp(inputBuffer)
                .resize({
                    width: 1920,
                    height: 1920,
                    fit: sharp.fit.inside,
                    withoutEnlargement: true
                })
                .jpeg({ quality: 80, progressive: true })
                .toBuffer();

            const oldSize = (inputBuffer.length / 1024 / 1024).toFixed(2);
            const newSize = (optimizedBuffer.length / 1024 / 1024).toFixed(2);
            console.log(`[ImageService] Optimización completa: ${oldSize}MB -> ${newSize}MB`);

            return {
                buffer: optimizedBuffer,
                mimetype: 'image/jpeg'
            };
        } catch (error) {
            console.error('[ImageService] Error al optimizar imagen:', error);
            // Fallback: retornar el buffer original si falla la optimización
            return {
                buffer: inputBuffer,
                mimetype: 'image/jpeg'
            };
        }
    }
}
