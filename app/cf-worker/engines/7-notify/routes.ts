import { Hono } from 'hono';
import type { NotifyEvent } from './types';

interface NotifyEnv {
  Bindings: {
    NOTIFY_QUEUE: Queue<NotifyEvent>;
  }
}

const notify = new Hono<NotifyEnv>();

notify.post('/dispatch', async (c) => {
  try {
    const event = await c.req.json<NotifyEvent>();
    
    if (!event.type) {
      return c.json({ error: 'event.type is required' }, 400);
    }

    if (c.env.NOTIFY_QUEUE) {
      await c.env.NOTIFY_QUEUE.send(event);
      return c.json({ success: true, message: 'Notification enqueued' });
    } else {
      // If queue is not bound (local dev without queue), we can log a warning
      console.warn('NOTIFY_QUEUE is not bound. Skipping enqueue.');
      return c.json({ success: false, message: 'Queue not configured in this environment' }, 500);
    }
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export { notify };
