import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const port = Number(process.argv[2] || 4173);
const root = path.resolve(process.argv[3] || process.cwd());
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.m4v': 'video/mp4',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }

  if (request.method === 'POST' && pathname === '/__form-test__') {
    request.resume();
    request.on('end', () => {
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8'
      }).end('{"ok":true}');
    });
    return;
  }

  let file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(`${root}${path.sep}`) && file !== root) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  } catch {
    response.writeHead(404).end('Not found');
    return;
  }

  const stat = fs.statSync(file);
  const common = {
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
    'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream'
  };
  const range = request.headers.range;

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const start = match && match[1] ? Number(match[1]) : 0;
    const end = Math.min(match && match[2] ? Number(match[2]) : stat.size - 1, stat.size - 1);
    if (!match || start > end || start >= stat.size) {
      response.writeHead(416, { ...common, 'Content-Range': `bytes */${stat.size}` }).end();
      return;
    }
    response.writeHead(206, {
      ...common,
      'Content-Length': end - start + 1,
      'Content-Range': `bytes ${start}-${end}/${stat.size}`
    });
    if (request.method === 'HEAD') response.end();
    else fs.createReadStream(file, { start, end }).pipe(response);
    return;
  }

  response.writeHead(200, { ...common, 'Content-Length': stat.size });
  if (request.method === 'HEAD') response.end();
  else fs.createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`ArchAngel preview: http://localhost:${port}`);
});
