"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPostUsageLimit = exports.checkAiUsageLimit = void 0;
const WorkspaceRepository_1 = require("../repositories/WorkspaceRepository");
const workspaceRepository = new WorkspaceRepository_1.WorkspaceRepository();
// Limits could be in a config file or DB, hardcoded for now
const PLAN_LIMITS = {
    free: { ai_credits: 30, posts: 50 },
    pro: { ai_credits: 500, posts: 1000 },
    agency: { ai_credits: 5000, posts: 10000 },
};
const checkAiUsageLimit = async (req, res, next) => {
    try {
        const workspaceId = req.user.workspace_id;
        const workspace = await workspaceRepository.findById(workspaceId);
        if (!workspace) {
            res.status(404).json({ error: 'Workspace not found' });
            return;
        }
        const plan = (workspace.plan_id || 'free');
        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
        if ((workspace.ai_credits_used || 0) >= limits.ai_credits) {
            res.status(402).json({ error: 'AI credit limit reached for this billing cycle. Please upgrade your plan.' });
            return;
        }
        // We increment the usage AFTER the request is successful ideally, or we can just increment here
        // We will increment in the controller to ensure it actually generated something
        next();
    }
    catch (error) {
        console.error('Error checking AI limit:', error);
        res.status(500).json({ error: 'Internal server error checking usage limits' });
    }
};
exports.checkAiUsageLimit = checkAiUsageLimit;
const checkPostUsageLimit = async (req, res, next) => {
    try {
        const workspaceId = req.user.workspace_id;
        const workspace = await workspaceRepository.findById(workspaceId);
        if (!workspace) {
            res.status(404).json({ error: 'Workspace not found' });
            return;
        }
        const plan = (workspace.plan_id || 'free');
        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
        if ((workspace.posts_used || 0) >= limits.posts) {
            res.status(402).json({ error: 'Post limit reached for this billing cycle. Please upgrade your plan.' });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Error checking Post limit:', error);
        res.status(500).json({ error: 'Internal server error checking usage limits' });
    }
};
exports.checkPostUsageLimit = checkPostUsageLimit;
