export class AppError extends Error {
    public readonly statusCode: number;
    public readonly codigoRegla?: string;

    constructor(message: string, statusCode: number, codigoRegla?: string) {
        super(message);
        this.statusCode = statusCode;
        this.codigoRegla = codigoRegla;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}