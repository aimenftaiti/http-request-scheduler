import * as http from 'http';
import { RequestScheduler } from './services/RequestScheduler';
import { RequestWithPriority } from './models/RequestWithPriority';

const requestScheduler = new RequestScheduler();

const server = http.createServer((req, res) => {
    const { url, method } = req;

    if (url === '/' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("Welcome to the http request scheduler");
    }

    else if (req.method === 'POST' && req.url === '/add_requests') {
        let body = '';

        req.on('data', (chunk) => {
            
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const requests: RequestWithPriority[] = JSON.parse(body);
                console.log('Requests received:', requests);

                requestScheduler.addRequests(requests);

                const processedRequests = await requestScheduler.getProcessedRequests(requests);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(processedRequests);
            } catch (error) {
                
                console.error('Error processing data:', error);
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Error processing data');
            }
        });
    }

    else if(req.method === 'GET' && req.url === '/request_status/{id}') {
        const id = req.url.split('/')[2];
        const request = requestScheduler.getRequestById(id);

        if(request) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(request);
        }

        else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Request not found');
        }
    }

    else if(req.method === 'DELETE' && req.url === '/cancel_request/{id}') {
        const id = req.url.split('/')[2];
        const request = requestScheduler.getRequestById(id);
        const canceled = requestScheduler.cancelRequest(request);

        if(canceled) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Request canceled successfully');
        }

        else {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Request cannot be canceled');
        }
    }

    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Page not found');
    }
});

const port = 3000;
server.listen(port, () => {
    requestScheduler.run();
    console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});