import persistentTextStreaming from '@convex-dev/persistent-text-streaming/convex.config';
import { defineApp } from 'convex/server';

const app = defineApp();
// The plugin currently doesn't expose typed options; keep a simple config object
app.use(persistentTextStreaming, { name: 'persistentTextStreaming' as const });

export default app;
