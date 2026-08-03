export interface SocialMediaProvider {
    /**
     * Publica contenido en la red social
     * @param accountId El ID de la cuenta en nuestra base de datos
     * @param content El texto de la publicación
     * @param mediaUrl Opcional: URL de la imagen o video
     * @returns ID de la publicación en la red social original
     */
    publish(accountId: string, content: string, mediaUrl?: string): Promise<string>;

    /**
     * Intenta refrescar el token de acceso si está próximo a expirar
     * @param accountId El ID de la cuenta en nuestra base de datos
     */
    refreshToken(accountId: string): Promise<void>;

    /**
     * Valida si el token sigue activo y cuenta con los scopes necesarios
     */
    validateScopes(accountId: string): Promise<boolean>;
}
