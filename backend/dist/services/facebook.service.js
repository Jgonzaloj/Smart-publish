"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookService = void 0;
const axios_1 = __importDefault(require("axios"));
const cache_service_1 = require("./cache.service");
/**
 * SKILL 4 - Especialista en APIs
 * Facebook / Instagram Graph API Service
 */
class FacebookService {
    GRAPH_API_URL = 'https://graph.facebook.com/v19.0';
    get APP_ID() { return process.env.FB_APP_ID || ''; }
    get APP_SECRET() { return process.env.FB_APP_SECRET || ''; }
    /**
     * Genera la URL de autorización para que el usuario inicie sesión con Facebook
     */
    getAuthUrl(redirectUri) {
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
    async exchangeCodeForToken(code, redirectUri) {
        try {
            const url = `${this.GRAPH_API_URL}/oauth/access_token?client_id=${this.APP_ID}&redirect_uri=${redirectUri}&client_secret=${this.APP_SECRET}&code=${code}`;
            const response = await axios_1.default.get(url);
            return response.data.access_token;
        }
        catch (error) {
            console.error('Error al intercambiar código por token:', error.response?.data || error.message);
            throw new Error('Autenticación fallida con Facebook');
        }
    }
    /**
     * Convierte un Short-Lived Token (2 horas) a un Long-Lived Token (60 días)
     * ¡Crucial para la automatización a largo plazo!
     */
    async getLongLivedToken(shortLivedToken) {
        try {
            const url = `${this.GRAPH_API_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.APP_ID}&client_secret=${this.APP_SECRET}&fb_exchange_token=${shortLivedToken}`;
            const response = await axios_1.default.get(url);
            return {
                token: response.data.access_token,
                expires_in: response.data.expires_in || (60 * 24 * 60 * 60) // Asume 60 días si no lo devuelve
            };
        }
        catch (error) {
            console.error('Error al generar Long-Lived Token:', error);
            throw new Error('Fallo al extender la vida del token');
        }
    }
    /**
     * Obtiene el ID y Nombre de la cuenta de Facebook usando el token
     */
    async getUserProfile(accessToken) {
        try {
            const url = `${this.GRAPH_API_URL}/me?access_token=${accessToken}`;
            const response = await axios_1.default.get(url);
            return {
                id: response.data.id,
                name: response.data.name
            };
        }
        catch (error) {
            console.error('Error al obtener perfil:', error);
            throw new Error('Fallo al obtener datos del perfil de Facebook');
        }
    }
    /**
     * Obtiene las páginas de Facebook administradas por el usuario
     */
    async getPages(userAccessToken, forceRefresh = false) {
        const cacheKey = `fb_pages_${userAccessToken.substring(0, 15)}`; // Usamos parte del token como clave
        if (!forceRefresh) {
            const cachedPages = await cache_service_1.CacheService.get(cacheKey);
            if (cachedPages) {
                console.log('[Cache] Retornando páginas desde Redis (0ms)');
                return cachedPages;
            }
        }
        try {
            console.log('[API] Obteniendo páginas desde Graph API (Lento)');
            const url = `${this.GRAPH_API_URL}/me/accounts?access_token=${userAccessToken}`;
            const response = await axios_1.default.get(url);
            const pages = response.data.data || [];
            // Guardar en caché por 1 hora (3600 segundos)
            await cache_service_1.CacheService.set(cacheKey, pages, 3600);
            return pages;
        }
        catch (error) {
            console.error('Error al obtener páginas:', error);
            throw new Error('Fallo al obtener las páginas de Facebook vinculadas');
        }
    }
    /**
     * Publica un mensaje o una imagen en una Página de Facebook específica
     */
    async publishToPage(pageId, pageAccessToken, message, imageFile) {
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
                const response = await axios_1.default.post(url, form, {
                    headers: { ...form.getHeaders() }
                });
                return response.data.id; // Retorna el ID de la foto/post
            }
            else {
                // Publicar Solo Texto
                const url = `${this.GRAPH_API_URL}/${pageId}/feed`;
                const response = await axios_1.default.post(url, {
                    message: message,
                    access_token: pageAccessToken
                });
                return response.data.id; // Retorna el ID del post
            }
        }
        catch (error) {
            console.error('Error al publicar en la página:', error);
            throw new Error('Fallo al publicar el contenido en Facebook');
        }
    }
    /**
     * Obtiene la cuenta de Instagram Business asociada a una página de Facebook
     */
    async getInstagramAccount(pageId, pageAccessToken) {
        try {
            const url = `${this.GRAPH_API_URL}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`;
            const response = await axios_1.default.get(url);
            if (response.data && response.data.instagram_business_account) {
                return response.data.instagram_business_account.id;
            }
            return null;
        }
        catch (error) {
            console.error('Error al obtener cuenta de Instagram:', error);
            return null; // Si no tiene cuenta vinculada, retornamos null
        }
    }
    /**
     * Publica una imagen en una cuenta de Instagram Business
     */
    async publishToInstagram(igUserId, pageAccessToken, message, imageUrl) {
        try {
            // Paso 1: Crear el contenedor de media en Instagram
            const createMediaUrl = `${this.GRAPH_API_URL}/${igUserId}/media`;
            const mediaResponse = await axios_1.default.post(createMediaUrl, {
                image_url: imageUrl,
                caption: message,
                access_token: pageAccessToken
            });
            const creationId = mediaResponse.data.id;
            // Paso 2: Publicar el contenedor
            const publishUrl = `${this.GRAPH_API_URL}/${igUserId}/media_publish`;
            const publishResponse = await axios_1.default.post(publishUrl, {
                creation_id: creationId,
                access_token: pageAccessToken
            });
            return publishResponse.data.id; // Retorna el ID del post en Instagram
        }
        catch (error) {
            console.error('Error al publicar en Instagram:', error.response?.data || error.message);
            throw new Error('Fallo al publicar el contenido en Instagram');
        }
    }
    /**
     * Obtiene insights de la pagina (Analíticas Fase 4)
     */
    async getPageInsights(pageId, pageAccessToken) {
        try {
            const url = `${this.GRAPH_API_URL}/${pageId}/insights?metric=page_impressions,page_post_engagements&period=day&access_token=${pageAccessToken}`;
            const response = await axios_1.default.get(url);
            return response.data.data;
        }
        catch (error) {
            console.error('Error al obtener insights:', error.response?.data || error.message);
            throw new Error('Fallo al obtener insights de Facebook');
        }
    }
}
exports.FacebookService = FacebookService;
