"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRepository = void 0;
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
class PostRepository {
    async create(post) {
        const id = (0, uuid_1.v4)();
        await database_1.pool.query(`INSERT INTO posts (id, workspace_id, user_id, content, status, scheduled_at, media_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, post.workspace_id, post.user_id, post.content, post.status, post.scheduled_at || null, post.media_url || null]);
        return id;
    }
    async findById(id) {
        const [rows] = await database_1.pool.query('SELECT * FROM posts WHERE id = ? LIMIT 1', [id]);
        return rows.length > 0 ? rows[0] : null;
    }
    async updateStatus(id, status, jobId) {
        if (jobId !== undefined) {
            await database_1.pool.query('UPDATE posts SET status = ?, bullmq_job_id = ? WHERE id = ?', [status, jobId, id]);
        }
        else {
            await database_1.pool.query('UPDATE posts SET status = ? WHERE id = ?', [status, id]);
        }
    }
    async updateContent(id, newContent) {
        await database_1.pool.query('UPDATE posts SET content = ? WHERE id = ?', [newContent, id]);
    }
    async duplicate(id) {
        const original = await this.findById(id);
        if (!original)
            throw new Error('Post no encontrado');
        const newId = (0, uuid_1.v4)();
        await database_1.pool.query(`INSERT INTO posts (id, workspace_id, user_id, content, status)
             VALUES (?, ?, ?, ?, 'DRAFT')`, [newId, original.workspace_id, original.user_id, original.content]);
        return newId;
    }
}
exports.PostRepository = PostRepository;
