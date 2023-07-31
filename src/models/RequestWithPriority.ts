import * as http from 'http';
import {State} from './State';
import * as crypto from 'crypto';

export class RequestWithPriority {
    private id: string;
    private priority: number;
    private options: http.RequestOptions;
    private state: State;
    private clientRequest?: http.ClientRequest;
    private response?: string;

    constructor(priority: number, options: http.RequestOptions) {
        this.id = crypto.randomUUID();
        this.options = options;
        this.priority = priority;
        this.state = State.CREATED;
    }

    public getId(){
        return this.id;
    }

    public getOptions(){
        return this.options;
    }

    public setOptions(options: http.RequestOptions){
        this.options = options;
    }

    public getPriority(){
        return this.priority;
    }

    public setPriority(priority: number){
        this.priority = priority;
    }

    public getState(){
        return this.state;
    }

    public setState(state: State){
        this.state = state;
    }

    public setHTTPRequest(clientRequest: http.ClientRequest) {
        this.clientRequest = clientRequest;
    }

    public getHTTPRequest(){
        return this.clientRequest;
    }

    public setResponse(response: string){
        this.response = response;
    }

    public getResponse(){
        return this.response;
    }
}