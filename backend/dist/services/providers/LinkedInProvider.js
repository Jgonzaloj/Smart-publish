"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedInProvider = void 0;
const database_1 = require("../../config/database");
class LinkedInProvider {
    async publish(accountId, content, mediaUrl) {
        // En un caso real, obtendríamos el token de la DB
        const [rows] = await database_1.pool.query('SELECT access_token, account_name FROM social_accounts WHERE id = ?', [accountId]);
        if (!rows || rows.length === 0) {
            throw new Error(`Cuenta de LinkedIn no encontrada para el ID: ${accountId}`);
        }
        const accessToken = rows[0].access_token;
        const linkedInUrn = `urn:li:person:${rows[0].account_name}`; // Simulación, en la vida real es un URN único
        console.log(`[LinkedInProvider] Publicando en ${linkedInUrn}: ${content}`);
        // Mock MVP: Simular publicación exitosa a la API de LinkedIn
        // En código real sería un POST a https://api.linkedin.com/v2/ugcPosts
        return `linkedin_simulated_id_${Date.now()}`;
    }
    async refreshToken(accountId) {
        // LinkedIn tokens duran 60 días, deben ser renovados antes.
        console.log(`[LinkedInProvider] Refrescando token para la cuenta ${accountId}`);
    }
    async validateScopes(accountId) {
        return true;
    }
}
exports.LinkedInProvider = LinkedInProvider;
