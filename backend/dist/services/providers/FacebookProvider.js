"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookProvider = void 0;
const facebook_service_1 = require("../facebook.service");
const SocialAccountRepository_1 = require("../../repositories/SocialAccountRepository");
const database_1 = require("../../config/database");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class FacebookProvider {
    facebookService;
    accountRepository;
    constructor() {
        this.facebookService = new facebook_service_1.FacebookService();
        this.accountRepository = new SocialAccountRepository_1.SocialAccountRepository();
    }
    async publish(accountId, content, mediaUrl) {
        // En un caso real, buscaríamos la cuenta por su accountId
        // Por simplicidad del MVP, usamos la lógica para buscar el token directamente
        // Asumiendo que `accountId` es el ID interno (uuid) de la tabla `social_accounts`
        const [rows] = await database_1.pool.query('SELECT access_token FROM social_accounts WHERE id = ?', [accountId]);
        if (!rows || rows.length === 0) {
            throw new Error(`Cuenta de Facebook no encontrada para el ID: ${accountId}`);
        }
        const userToken = rows[0].access_token;
        const pages = await this.facebookService.getPages(userToken);
        if (pages.length === 0) {
            throw new Error('No hay páginas vinculadas a esta cuenta de Facebook.');
        }
        // MVP: Tomar la primera página. En V2, el usuario elegiría el pageId exacto.
        const page = pages[0];
        let publishedId;
        if (mediaUrl) {
            // Reconstruir la ruta local absoluta
            const fileName = mediaUrl.replace('/uploads/', '');
            const filePath = path_1.default.join(process.cwd(), 'uploads', fileName);
            if (fs_1.default.existsSync(filePath)) {
                // Crear objeto "file" simulando el formato de Multer para la función existente
                const buffer = fs_1.default.readFileSync(filePath);
                const fakeMulterFile = {
                    buffer,
                    originalname: fileName,
                    mimetype: 'image/jpeg'
                };
                publishedId = await this.facebookService.publishToPage(page.id, page.access_token, content, fakeMulterFile);
            }
            else {
                // Fallback a solo texto si la imagen se perdió
                console.warn(`Archivo de imagen no encontrado: ${filePath}`);
                publishedId = await this.facebookService.publishToPage(page.id, page.access_token, content);
            }
        }
        else {
            // Solo Texto
            publishedId = await this.facebookService.publishToPage(page.id, page.access_token, content);
        }
        return publishedId;
    }
    async refreshToken(accountId) {
        const [rows] = await database_1.pool.query('SELECT access_token FROM social_accounts WHERE id = ?', [accountId]);
        if (!rows || rows.length === 0)
            return;
        const currentToken = rows[0].access_token;
        const { token, expires_in } = await this.facebookService.getLongLivedToken(currentToken);
        const expiresAt = new Date(Date.now() + expires_in * 1000);
        await database_1.pool.query('UPDATE social_accounts SET access_token = ?, token_expires_at = ? WHERE id = ?', [token, expiresAt, accountId]);
    }
    async validateScopes(accountId) {
        // Lógica para consultar a Meta si los scopes (pages_manage_posts, etc.) siguen vigentes
        // Ejemplo simplificado: intentamos obtener las páginas. Si falla con error de auth, retornamos false.
        try {
            const [rows] = await database_1.pool.query('SELECT access_token FROM social_accounts WHERE id = ?', [accountId]);
            if (!rows || rows.length === 0)
                return false;
            await this.facebookService.getPages(rows[0].access_token);
            return true;
        }
        catch (e) {
            return false;
        }
    }
}
exports.FacebookProvider = FacebookProvider;
