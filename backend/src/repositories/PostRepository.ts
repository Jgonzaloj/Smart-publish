import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

export interface Post {
    id: string;
    workspace_id: string;
    user_id: string;
    content: string;
    status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'CANCELLED' | 'PAUSED';
    bullmq_job_id?: string;
    scheduled_at?: Date;
    published_at?: Date;
    media_url?: string;
}

export interface CreatePostDTO {
    workspace_id: string;
    user_id: string;
    content: string;
    status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';
    scheduled_at?: Date;
    media_url?: string;
}

export class PostRepository {
    async create(post: CreatePostDTO): Promise<string> {
        const id = uuidv4();
        await pool.query(
            `INSERT INTO posts (id, workspace_id, user_id, content, status, scheduled_at, media_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, post.workspace_id, post.user_id, post.content, post.status, post.scheduled_at || null, post.media_url || null]
        );
        return id;
    }

    async findById(id: string): Promise<Post | null> {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM posts WHERE id = ? LIMIT 1', [id]);
        return rows.length > 0 ? (rows[0] as Post) : null;
    }

    async updateStatus(id: string, status: Post['status'], jobId?: string): Promise<void> {
        if (jobId !== undefined) {
            await pool.query('UPDATE posts SET status = ?, bullmq_job_id = ? WHERE id = ?', [status, jobId, id]);
        } else {
            await pool.query('UPDATE posts SET status = ? WHERE id = ?', [status, id]);
        }
    }

    async updateContent(id: string, newContent: string): Promise<void> {
        await pool.query('UPDATE posts SET content = ? WHERE id = ?', [newContent, id]);
    }

    async duplicate(id: string): Promise<string> {
        const original = await this.findById(id);
        if (!original) throw new Error('Post no encontrado');

        const newId = uuidv4();
        await pool.query(
            `INSERT INTO posts (id, workspace_id, user_id, content, status)
             VALUES (?, ?, ?, ?, 'DRAFT')`,
            [newId, original.workspace_id, original.user_id, original.content]
        );
        return newId;
    }
}
