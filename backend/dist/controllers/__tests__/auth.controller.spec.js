"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controller_1 = require("../auth.controller");
const database_1 = require("../../config/database");
const auth_schemas_1 = require("../../schemas/auth.schemas");
const bcrypt_1 = __importDefault(require("bcrypt"));
jest.mock('../../config/database', () => ({
    pool: {
        query: jest.fn()
    }
}));
jest.mock('../../services/email.service', () => {
    return {
        EmailService: jest.fn().mockImplementation(() => ({
            sendWelcomeEmail: jest.fn().mockResolvedValue(true),
            sendPasswordResetEmail: jest.fn().mockResolvedValue(true)
        }))
    };
});
describe('AuthController & Auth Schemas (Auditoría de Seguridad)', () => {
    let req;
    let res;
    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });
    describe('Zod Validation Schemas', () => {
        it('Debe rechazar email con formato inválido en login', async () => {
            const invalidData = { email: 'not-an-email', password: 'secretpassword' };
            await expect(auth_schemas_1.loginSchema.parseAsync(invalidData)).rejects.toThrow();
        });
        it('Debe rechazar contraseñas de menos de 6 caracteres en register', async () => {
            const shortPasswordData = { email: 'user@example.com', password: '123' };
            await expect(auth_schemas_1.registerSchema.parseAsync(shortPasswordData)).rejects.toThrow();
        });
        it('Debe validar correctamente datos de registro válidos', async () => {
            const validData = { email: 'user@example.com', password: 'secure_password_123', name: 'Test User' };
            const result = await auth_schemas_1.registerSchema.parseAsync(validData);
            expect(result.email).toBe('user@example.com');
            expect(result.name).toBe('Test User');
        });
    });
    describe('AuthController.login', () => {
        it('Debe retornar 401 si las credenciales son incorrectas (usuario no existe)', async () => {
            req.body = { email: 'inexistente@example.com', password: 'password123' };
            database_1.pool.query.mockResolvedValueOnce([[]]); // No rows found
            await auth_controller_1.AuthController.login(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Credenciales inválidas'
            }));
        });
        it('Debe retornar 401 si el password no coincide', async () => {
            req.body = { email: 'user@example.com', password: 'wrongpassword' };
            database_1.pool.query.mockResolvedValueOnce([[
                    { id: 'user-1', email: 'user@example.com', password_hash: 'hashed_pw', workspace_id: 'ws-1' }
                ]]);
            jest.spyOn(bcrypt_1.default, 'compare').mockImplementation(async () => false);
            await auth_controller_1.AuthController.login(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Credenciales inválidas'
            }));
        });
        it('Debe retornar 200 con JWT válido cuando las credenciales son correctas', async () => {
            req.body = { email: 'user@example.com', password: 'correctpassword' };
            database_1.pool.query.mockResolvedValueOnce([[
                    { id: 'user-1', email: 'user@example.com', password_hash: 'hashed_pw', workspace_id: 'ws-1', role: 'ADMIN' }
                ]]);
            jest.spyOn(bcrypt_1.default, 'compare').mockImplementation(async () => true);
            await auth_controller_1.AuthController.login(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                token: expect.any(String),
                workspace_id: 'ws-1',
                user: expect.objectContaining({
                    id: 'user-1',
                    email: 'user@example.com',
                    role: 'ADMIN'
                })
            }));
        });
    });
    describe('AuthController.register', () => {
        it('Debe retornar 400 si el correo ya está registrado', async () => {
            req.body = { email: 'existente@example.com', password: 'password123' };
            database_1.pool.query.mockResolvedValueOnce([[{ id: 'existing-id' }]]);
            await auth_controller_1.AuthController.register(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'El correo ya está registrado'
            }));
        });
    });
});
