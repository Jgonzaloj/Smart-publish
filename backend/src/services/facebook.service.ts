import axios from 'axios';
import { CacheService } from './cache.service';

/**
 * SKILL 4 - Especialista en APIs
 * Facebook / Instagram Graph API Service
 */
export class FacebookService {
    private readonly GRAPH_API_URL = 'https://graph.facebook.com/v19.0';
    private get APP_ID(): string { return process.env.FB_APP_ID || ''; }
    private get APP_SECRET(): string { return process.env.FB_APP_SECRET || ''; }

    /**
     * Genera la URL de autorización para que el usuario inicie sesión con Facebook
     */
    public getAuthUrl(redirectUri: string): string {
        const scopes = [
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_posts'
        ].join(',');

        return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${this.APP_ID}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code`;
    }

    /**
     * Intercambia el código temporal por un Short-Lived Access Token
     */
    public async exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
        try {
            const url = `${this.GRAPH_API_URL}/oauth/access_token?client_id=${this.APP_ID}&redirect_uri=${redirectUri}&client_secret=${this.APP_SECRET}&code=${code}`;
            const response = await axios.get(url);
            return response.data.access_token;
        } catch (error: any) {
            console.error('Error al intercambiar código por token:', error.response?.data || error.message);
            throw new Error('Autenticación fallida con Facebook');
        }
    }

    /**
     * Convierte un Short-Lived Token (2 horas) a un Long-Lived Token (60 días)
     * ¡Crucial para la automatización a largo plazo!
     */
    public async getLongLivedToken(shortLivedToken: string): Promise<{ token: string; expires_in: number }> {
        try {
            const url = `${this.GRAPH_API_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.APP_ID}&client_secret=${this.APP_SECRET}&fb_exchange_token=${shortLivedToken}`;
            const response = await axios.get(url);
            
            return {
                token: response.data.access_token,
                expires_in: response.data.expires_in || (60 * 24 * 60 * 60) // Asume 60 días si no lo devuelve
            };
        } catch (error) {
            console.error('Error al generar Long-Lived Token:', error);
            throw new Error('Fallo al extender la vida del token');
        }
    }

    /**
     * Obtiene el ID y Nombre de la cuenta de Facebook usando el token
     */
    public async getUserProfile(accessToken: string): Promise<{ id: string; name: string }> {
        try {
            const url = `${this.GRAPH_API_URL}/me?access_token=${accessToken}`;
            const response = await axios.get(url);
            return {
                id: response.data.id,
                name: response.data.name
            };
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            throw new Error('Fallo al obtener datos del perfil de Facebook');
        }
    }

    /**
     * Obtiene las páginas de Facebook administradas por el usuario
     */
    public async getPages(userAccessToken: string, forceRefresh: boolean = false): Promise<any[]> {
        const cacheKey = `fb_pages_${userAccessToken.substring(0, 15)}`; // Usamos parte del token como clave

        if (!forceRefresh) {
            const cachedPages = await CacheService.get<any[]>(cacheKey);
            if (cachedPages) {
                console.log('[Cache] Retornando páginas desde Redis (0ms)');
                return cachedPages;
            }
        }

        try {
            console.log('[API] Obteniendo páginas desde Graph API (Lento)');
            const url = `${this.GRAPH_API_URL}/me/accounts?access_token=${userAccessToken}`;
            const response = await axios.get(url);
            
            const pages = response.data.data || [];
            
            // Guardar en caché por 1 hora (3600 segundos)
            await CacheService.set(cacheKey, pages, 3600);
            
            return pages;
        } catch (error) {
            console.error('Error al obtener páginas:', error);
            throw new Error('Fallo al obtener las páginas de Facebook vinculadas');
        }
    }

    /**
     * Publica un mensaje o una imagen en una Página de Facebook específica
     */
    public async publishToPage(pageId: string, pageAccessToken: string, message: string, imageFile?: Express.Multer.File): Promise<string> {
        try {
            if (imageFile) {
                // Publicar Imagen + Texto
                const FormData = require('form-data');
                const form = new FormData();
                form.append('message', message);
                form.append('access_token', pageAccessToken);
                form.append('source', imageFile.buffer, {
                    filename: imageFile.originalname,
                    contentType: imageFile.mimetype,
                });

                const url = `${this.GRAPH_API_URL}/${pageId}/photos`;
                const response = await axios.post(url, form, {
                    headers: { ...form.getHeaders() }
                });
                return response.data.id; // Retorna el ID de la foto/post
            } else {
                // Publicar Solo Texto
                const url = `${this.GRAPH_API_URL}/${pageId}/feed`;
                const response = await axios.post(url, {
                    message: message,
                    access_token: pageAccessToken
                });
                return response.data.id; // Retorna el ID del post
            }
        } catch (error) {
            console.error('Error al publicar en la página:', error);
            throw new Error('Fallo al publicar el contenido en Facebook');
        }
    }

    /**
     * Obtiene la cuenta de Instagram Business asociada a una página de Facebook
     */
    public async getInstagramAccount(pageId: string, pageAccessToken: string): Promise<string | null> {
        try {
            const url = `${this.GRAPH_API_URL}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`;
            const response = await axios.get(url);
            
            if (response.data && response.data.instagram_business_account) {
                return response.data.instagram_business_account.id;
            }
            return null;
        } catch (error) {
            console.error('Error al obtener cuenta de Instagram:', error);
            return null; // Si no tiene cuenta vinculada, retornamos null
        }
    }

    /**
     * Publica una imagen en una cuenta de Instagram Business
     */
    public async publishToInstagram(igUserId: string, pageAccessToken: string, message: string, imageUrl: string): Promise<string> {
        try {
            // Paso 1: Crear el contenedor de media en Instagram
            const createMediaUrl = `${this.GRAPH_API_URL}/${igUserId}/media`;
            const mediaResponse = await axios.post(createMediaUrl, {
                image_url: imageUrl,
                caption: message,
                access_token: pageAccessToken
            });

            const creationId = mediaResponse.data.id;

            // Paso 2: Publicar el contenedor
            const publishUrl = `${this.GRAPH_API_URL}/${igUserId}/media_publish`;
            const publishResponse = await axios.post(publishUrl, {
                creation_id: creationId,
                access_token: pageAccessToken
            });

            return publishResponse.data.id; // Retorna el ID del post en Instagram
        } catch (error: any) {
            console.error('Error al publicar en Instagram:', error.response?.data || error.message);
            throw new Error('Fallo al publicar el contenido en Instagram');
        }
    }
}
