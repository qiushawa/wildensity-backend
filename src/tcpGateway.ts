import net from 'net';
import axios from 'axios';
import { CONFIG } from './config/config';

const TCP_PORT = 9000;
const ALLOWED_METHODS = ['POST', 'GET', 'PATCH', 'DELETE', 'PUT'];
const ALLOWED_PATHS = ['*'];

export const startTcpGateway = () => {
    const server = net.createServer();

    server.on('connection', socket => {
        console.log('TCP Client connected:', socket.remoteAddress);

        let buffer = '';
        socket.on('data', async chunk => {
            buffer += chunk.toString();

            let index;
            while ((index = buffer.indexOf(';')) !== -1) {
                const line = buffer.slice(0, index).trim();
                buffer = buffer.slice(index + 1);
                if (!line) continue;

                await handleLine(line, socket);
            }
        });

        socket.on('close', () => console.log('TCP Client disconnected'));
        socket.on('error', err => console.error('TCP socket error:', err.message));
    });

    server.listen(TCP_PORT, () => console.log(`TCP Gateway running on ${TCP_PORT}`));
};

const handleLine = async (line: string, socket: net.Socket) => {
    const [method, path, ...rest] = line.split('|');
    const bodyStr = rest.join('|');

    if (
        !ALLOWED_METHODS.includes(method) ||
        !ALLOWED_PATHS.some(p => p === '*' || p === path)
    ) {
        socket.write('ERR|INVALID\n');
        return;
    }

    let body: any;
    try { body = JSON.parse(bodyStr); }
    catch { socket.write('ERR|JSON\n'); return; }

    try {
        const rep = await axios({
            method,
            url: `http://127.0.0.1:${CONFIG.PORT}${path}`,
            data: body,
            timeout: 5000
        });

        const respStr = typeof rep.data === 'object' ? JSON.stringify(rep.data) : String(rep.data);
        socket.write(`OK|${respStr}\n`);

    } catch (err: any) {
        const msg = err.response ? `${err.response.status} ${err.response.statusText}` : err.message;
        socket.write(`ERR|HTTP|${msg}\n`);
    }
};
