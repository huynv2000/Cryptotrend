const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = 3000;
const hostname = '0.0.0.0';

// Simple Next.js server without Socket.IO
async function startServer() {
  try {
    console.log('🚀 Starting Next.js server...');
    
    // Create Next.js app
    const app = next({ 
      dev,
      dir: __dirname,
      conf: dev ? undefined : { distDir: './.next' }
    });

    await app.prepare();
    const handle = app.getRequestHandler();

    // Create HTTP server
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // Start the server
    server.listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Environment: ${dev ? 'Development' : 'Production'}`);
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
startServer();