"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostController = void 0;
const PostRepository_1 = require("../repositories/PostRepository");
const postRepository = new PostRepository_1.PostRepository();
class PostController {
    // GET /api/posts
    static async getPosts(req, res) {
        try {
            const workspaceId = req.user?.workspace_id;
            if (!workspaceId) {
                return res.status(401).json({ success: false, message: 'Usuario no autenticado en un workspace' });
            }
            const posts = await postRepository.findByWorkspace(workspaceId);
            return res.json({ success: true, posts });
        }
        catch (error) {
            console.error('Error fetching posts:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener publicaciones' });
        }
    }
    // GET /api/posts/:id
    static async getPostById(req, res) {
        try {
            const workspaceId = req.user?.workspace_id;
            const { id } = req.params;
            const post = await postRepository.findById(id);
            if (!post || post.workspace_id !== workspaceId) {
                return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
            }
            return res.json({ success: true, post });
        }
        catch (error) {
            console.error('Error fetching post:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener la publicación' });
        }
    }
    // DELETE /api/posts/:id
    static async deletePost(req, res) {
        try {
            const workspaceId = req.user?.workspace_id;
            const { id } = req.params;
            const deleted = await postRepository.delete(id, workspaceId);
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Publicación no encontrada o no autorizada' });
            }
            return res.json({ success: true, message: 'Publicación eliminada correctamente' });
        }
        catch (error) {
            console.error('Error deleting post:', error);
            return res.status(500).json({ success: false, message: 'Error al eliminar publicación' });
        }
    }
}
exports.PostController = PostController;
