import { Request, Response } from 'express';
import { PostRepository } from '../repositories/PostRepository';

const postRepository = new PostRepository();

export class PostController {
    // GET /api/posts
    static async getPosts(req: Request, res: Response) {
        try {
            const workspaceId = (req as any).user?.workspace_id;
            if (!workspaceId) {
                return res.status(401).json({ success: false, message: 'Usuario no autenticado en un workspace' });
            }

            const posts = await postRepository.findByWorkspace(workspaceId);
            return res.json({ success: true, posts });
        } catch (error: any) {
            console.error('Error fetching posts:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener publicaciones' });
        }
    }

    // GET /api/posts/:id
    static async getPostById(req: Request, res: Response) {
        try {
            const workspaceId = (req as any).user?.workspace_id;
            const { id } = req.params;

            const post = await postRepository.findById(id);
            if (!post || post.workspace_id !== workspaceId) {
                return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
            }

            return res.json({ success: true, post });
        } catch (error: any) {
            console.error('Error fetching post:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener la publicación' });
        }
    }

    // DELETE /api/posts/:id
    static async deletePost(req: Request, res: Response) {
        try {
            const workspaceId = (req as any).user?.workspace_id;
            const { id } = req.params;

            const deleted = await postRepository.delete(id, workspaceId);
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Publicación no encontrada o no autorizada' });
            }

            return res.json({ success: true, message: 'Publicación eliminada correctamente' });
        } catch (error: any) {
            console.error('Error deleting post:', error);
            return res.status(500).json({ success: false, message: 'Error al eliminar publicación' });
        }
    }
}
