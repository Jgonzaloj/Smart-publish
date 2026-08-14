"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queue_service_1 = require("../queue.service");
// Hacemos mock completo de BullMQ
jest.mock('bullmq', () => {
    return {
        Queue: jest.fn().mockImplementation(() => {
            return {
                add: jest.fn().mockResolvedValue({ id: 'mocked_job_id_123' }),
                getJob: jest.fn(),
                pause: jest.fn(),
                resume: jest.fn()
            };
        })
    };
});
describe('QueueService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('debería encolar un post con delay y reintentos (Exponential Backoff)', async () => {
        const payload = {
            postId: 'post-1',
            workspaceId: 'ws-1',
            platform: 'FACEBOOK',
            message: 'Hello World'
        };
        const delayMs = 5000;
        const jobId = await queue_service_1.QueueService.enqueuePost(payload, delayMs);
        expect(jobId).toBe('mocked_job_id_123');
        expect(queue_service_1.publishQueue.add).toHaveBeenCalledTimes(1);
        expect(queue_service_1.publishQueue.add).toHaveBeenCalledWith('publish-post', payload, expect.objectContaining({
            delay: delayMs,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 }
        }));
    });
    it('debería remover un job si existe', async () => {
        // Configuramos el mock de getJob para devolver un job con método remove
        const mockRemove = jest.fn();
        queue_service_1.publishQueue.getJob.mockResolvedValueOnce({ remove: mockRemove });
        const result = await queue_service_1.QueueService.removeJob('job-to-remove');
        expect(result).toBe(true);
        expect(queue_service_1.publishQueue.getJob).toHaveBeenCalledWith('job-to-remove');
        expect(mockRemove).toHaveBeenCalledTimes(1);
    });
    it('debería retornar false si intenta remover un job que no existe', async () => {
        queue_service_1.publishQueue.getJob.mockResolvedValueOnce(null);
        const result = await queue_service_1.QueueService.removeJob('non-existent-job');
        expect(result).toBe(false);
    });
});
