import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const postRoutes = Router();

postRoutes.use(authMiddleware);

postRoutes.get('/', PostController.getPosts);
postRoutes.get('/:id', PostController.getPostById);
postRoutes.delete('/:id', PostController.deletePost);
