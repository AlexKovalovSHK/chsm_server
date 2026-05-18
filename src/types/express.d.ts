import 'express';

declare module 'express' {
  export interface Request {
    currentOrgId?: string;
  }
}
