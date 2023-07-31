import { RequestWithPriority } from "../models/RequestWithPriority";
import { State } from "../models/State";
import * as http from 'http';
import { sleep } from "../utils/Sleep";
import { Priority } from "../models/Priority";

export class RequestScheduler {
    private pendingRequests: Record<number, RequestWithPriority[]>;
    private processingRequests:RequestWithPriority[];
    private processedRequests:RequestWithPriority[];

    constructor() {
        this.pendingRequests = {};
        this.processingRequests = [];
        this.processedRequests = [];
        for(let i=Priority.Very_Low; i<=Priority.Very_High; i++){
            this.pendingRequests[i] = [];
        }
    }
    public async getProcessedRequests(requests: RequestWithPriority[]): Promise<RequestWithPriority[]> {
        while (this.hasPendingRequests() || this.processingRequests.length > 0) {
            await sleep(200);
        }

        return this.processedRequests.filter((request) => {
            return requests.includes(request);
        });
    }

    private hasPendingRequests(){
        for(let i=Priority.Very_Low; i<=Priority.Very_High; i++){
            if(this.pendingRequests[i].length > 0){
                return true;
            }
        }
        return false;
    }

    public getPendingRequests(){
        return this.pendingRequests;
    }

    public getProcessingRequests(){
        return this.processingRequests;
    }

    public getRequestById(id: string): RequestWithPriority | undefined {
        //on parcours les requetes en attente
        for(let i=Priority.Very_Low; i<=Priority.Very_High; i++){
            for(const element of this.pendingRequests[i]){
                //si l'id de la requete correspond à l'id passé en paramètre
                if(element.getId() === id){
                    //on retourne la requete
                    return element;
                }
            }
        }
        //on parcours les requetes en cours d'exécution
        for(const element of this.processingRequests){
            //si l'id de la requete correspond à l'id passé en paramètre
            if(element.getId() === id){
                //on retourne la requete
                return element;
            }
        }
        //si on a rien trouvé, on retourne undefined
        return undefined;
    }

    public addRequests(requests: RequestWithPriority[]) {
        //Recherche de la requête à priorité max parmi les requêtes à ajouter
        const maxPriority = this.findRequestWithMaxPriority(requests).getPriority();

        //Parcours des requetes à ajouter
        requests.forEach((request) => {
            //S'il n'y a aucune requête en cours d'exécution
            if(this.getProcessingRequests().length === 0){
                //la requête courante passe en attente
                request.setState(State.PENDING)
                this.pendingRequests[request.getPriority()].push(request);
            }
            //S'il y a au moins une requête en cours d'exécution
            else {
                //Si la requete courante est de la priorité max 
                //ET que la priorité max en question est supérieure au max des requetes en cours d'execution
                //on exécute la requete
                //pourquoi ?
                //pour faire en sorte d'executer immédiatement les requetes
                //qui auraient une priorité supérieure ou égale aux requetes en cours d'exécution
                if(request.getPriority() === maxPriority && maxPriority >= this.findRequestWithMaxPriority(this.getProcessingRequests()).getPriority()){
                    this.performHTTPRequest(request);
                }
                //sinon...
                else {
                    //elle est passe en attente
                    request.setState(State.PENDING)
                    this.pendingRequests[request.getPriority()].push(request);
                }
            }
        });
    }

    private findRequestWithMaxPriority(requests: RequestWithPriority[]) {
        let requestToReturn = requests[0];
        requests.forEach((request) => {
            if (request.getPriority() > requestToReturn.getPriority()) {
                requestToReturn = request;
            }
        });
        return requestToReturn;
    }

    public cancelRequest(request: RequestWithPriority | undefined): boolean {
        if(request === undefined){  
            return false;
        }
        else {

            //Si la requete à annuler est en attente
            if(request.getState() === State.PENDING){
                const requestIndex = this.pendingRequests[request.getPriority()].indexOf(request);
                if (requestIndex !== -1) {
                    //on va seulement la terminer avant qu'elle soit exécutée
                    this.pendingRequests[request.getPriority()].splice(requestIndex, 1);
                    request.setState(State.TERMINATED);
                    return true;
                }
            }
            //si elle est en cours d'exécution
            if(request.getState() === State.PROCESSING){
                const processingIndex = this.processingRequests.indexOf(request);
                if (processingIndex !== -1) {
                    //on annule la requete
                    request.getHTTPRequest()?.destroy();
                    //et on la supprime du tableau des requetes en cours d'exécution
                    this.processingRequests.splice(processingIndex, 1);
                    //et on la termine
                    request.setState(State.TERMINATED);
                    return true;
                }
            }
            //retourne faux si la requete n'est ni en cours de traitement, ni en attente
            return false;
        }
    }

    public async run() {
        //boucle while pour une exécution "infinie"
        for (;;) {
            //s'il n'y aucune requete en cours d'exécution
            if (this.processingRequests.length === 0) {
                //on passe les prochaines requetes de pending à processings (en fonction de leur priorité)
                const requests = this.transferRequestsToProcess();
                // s'il n'y en a aucune, on ne fait rien (et on mets un sleep d'une secondes pour pas que ce soit trop rapide)
                if(requests.length === 0){
                    await sleep(1000);
                }
                //sinon
                else {
                    //on est exécute les requetes à exécuter
                    const requestPromises = requests.map(async (request) => {
                        console.log(request.getOptions())
                        await this.performHTTPRequest(request);
                    });
                    //on attend que toutes les promesses des requetes soient résolues
                    await Promise.all(requestPromises);
                }
            }
        }
    }

    private transferRequestsToProcess() {
        for (let i = Priority.Very_High; i >= Priority.Very_Low; i--) {
            //si on a des requetes en attente pour la priorité i
            if(this.pendingRequests[i].length > 0) {
                //on les transfert dans les requetes en cours d'exécution
                const requestToReturn = this.pendingRequests[i]
                this.pendingRequests[i] = [];
                return requestToReturn;
            }
        }
        return [];
    }

    private async performHTTPRequest(request: RequestWithPriority) {
        //on change l'état de la requete
        request.setState(State.PROCESSING);
        this.processingRequests.push(request);

        return new Promise<void>((resolve, reject) => {
            const req = http.request(request.getOptions(), (res) => {
                let responseData = '';
              
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
              
                res.on('end', () => {
                    request.setResponse(responseData);
                    request.setState(State.TERMINATED);
                    this.processingRequests.splice(this.processingRequests.indexOf(request), 1);
                    this.processedRequests.push(request);
                    resolve();
                });
            });
          
            req.on('error', (error) => {
                // on renvoie une erreur uniquement si l'erreur est différente de "socket hang up"
                // car on s'attend à cette erreur quand on annule une requete
                if(error.message !== "socket hang up"){
                    console.error(`Erreur de requête : ${error.message}`);
                    reject(error);
                }
            });
            
            // on ajoute un listener sur l'évènement close pour gérer le cas où la requête est annulée
            req.on('close', () => {
                request.setState(State.TERMINATED);
                this.processingRequests.splice(this.processingRequests.indexOf(request), 1);
                resolve();
            });
          
            // on envoie la requete
            req.end();

            // on sauvegarde la requête pour pouvoir l'annuler si besoin
            // en utilisant la méthode destroy() de l'objet http.ClientRequest
            request.setHTTPRequest(req);
        });
    }
}