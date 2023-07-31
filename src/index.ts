import * as http from 'http';
import { RequestWithPriority } from './models/RequestWithPriority';
import { RequestScheduler } from './services/RequestScheduler';
import { Priority } from './models/Priority';

function createRequest(priority: Priority, hostname:string, port:number, path:string, method:string) {
    const options: http.RequestOptions = {
        hostname: hostname,
        port: port,
        path: path, 
        method: method,
    };

    return new RequestWithPriority(priority, options);
}

async function main(){
    const requestScheduler = new RequestScheduler();

    const R1 = createRequest(Priority.High, "httpbin.org", 80, "/get?var=R1", "GET");
    const R2 = createRequest(Priority.Low, "httpbin.org", 80, "/get?var=R2", "GET");
    const R3 = createRequest(Priority.Medium, "httpbin.org", 80, "/get?var=R3", "GET");
    const R4 = createRequest(Priority.High, "httpbin.org", 80, "/get?var=R4", "GET");
    const R5 = createRequest(Priority.Medium, "httpbin.org", 80, "/get?var=R5", "GET");
    const R6 = createRequest(Priority.Low, "httpbin.org", 80, "/get?var=R6", "GET");

    requestScheduler.addRequests([R1, R2, R3, R4]);

    requestScheduler.run();

    requestScheduler.addRequests([R5, R6]);

    const canceled = requestScheduler.cancelRequest(R6);
    console.log("Requête R1 annulée :", canceled);
}

main();

