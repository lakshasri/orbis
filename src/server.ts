import { app } from './app';
import { env } from './config/env';

app.listen(env.APP_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`orbis api listening on port ${env.APP_PORT}`);
});
