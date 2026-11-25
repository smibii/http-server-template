export interface EventRequest {
    title: string;
    location: string;
}

export interface EventResponse extends EventRequest {
    id: number;
}
