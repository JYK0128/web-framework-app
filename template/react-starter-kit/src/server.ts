import handler from '@tanstack/react-start/server-entry';

export default {
  async fetch(req: Request): Promise<Response> {
    return handler.fetch(req);
  },
};
