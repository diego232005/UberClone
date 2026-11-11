const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');

const config = getDefaultConfig(__dirname);

/**
 * Proxy /mp-api/* → http://127.0.0.1:4000/*
 * Así el celular usa el mismo puerto que Expo (8081) y no necesita abrir el 4000.
 */
const previousEnhance = config.server?.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const base = previousEnhance
      ? previousEnhance(middleware, server)
      : middleware;

    return (req, res, next) => {
      if (!req.url?.startsWith('/mp-api')) {
        return base(req, res, next);
      }

      const targetPath = req.url.replace(/^\/mp-api/, '') || '/';
      const headers = { ...req.headers, host: '127.0.0.1:4000' };
      delete headers['origin'];

      const proxyReq = http.request(
        {
          hostname: '127.0.0.1',
          port: 4000,
          path: targetPath,
          method: req.method,
          headers,
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
          proxyRes.pipe(res);
        }
      );

      proxyReq.on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: `Backend :4000 no responde (${err.message}). Ejecuta: cd backend && npm start`,
          })
        );
      });

      req.pipe(proxyReq);
    };
  },
};

module.exports = config;
