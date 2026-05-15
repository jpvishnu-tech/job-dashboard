import { Router } from 'express';
import { protectAny } from '../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  clearNotifications,
} from '../controllers/notification.controller.js';

const router = Router();

router.use(protectAny);

router.get('/',              getNotifications);
router.get('/unread-count',  getUnreadCount);
router.patch('/:id/read',    markRead);
router.patch('/read-all',    markAllRead);
router.delete('/',           clearNotifications);

export default router;
