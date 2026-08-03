import { QueueService, publishQueue } from '../queue.service';

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
      platform: 'FACEBOOK' as const,
      message: 'Hello World'
    };

    const delayMs = 5000;
    
    const jobId = await QueueService.enqueuePost(payload, delayMs);
    
    expect(jobId).toBe('mocked_job_id_123');
    expect(publishQueue.add).toHaveBeenCalledTimes(1);
    expect(publishQueue.add).toHaveBeenCalledWith(
      'publish-post', 
      payload, 
      expect.objectContaining({
        delay: delayMs,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 }
      })
    );
  });

  it('debería remover un job si existe', async () => {
    // Configuramos el mock de getJob para devolver un job con método remove
    const mockRemove = jest.fn();
    (publishQueue.getJob as jest.Mock).mockResolvedValueOnce({ remove: mockRemove });

    const result = await QueueService.removeJob('job-to-remove');

    expect(result).toBe(true);
    expect(publishQueue.getJob).toHaveBeenCalledWith('job-to-remove');
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it('debería retornar false si intenta remover un job que no existe', async () => {
    (publishQueue.getJob as jest.Mock).mockResolvedValueOnce(null);

    const result = await QueueService.removeJob('non-existent-job');

    expect(result).toBe(false);
  });
});
