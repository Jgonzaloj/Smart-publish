import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';

export interface Workspace {
    id: string;
    name: string;
}

export class WorkspaceRepository {
    async findFirst(): Promise<Workspace | null> {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT id, name FROM workspaces LIMIT 1');
        return rows.length > 0 ? (rows[0] as Workspace) : null;
    }

    async create(workspace: Workspace): Promise<void> {
        await pool.query('INSERT INTO workspaces (id, name) VALUES (?, ?)', [workspace.id, workspace.name]);
    }
}
