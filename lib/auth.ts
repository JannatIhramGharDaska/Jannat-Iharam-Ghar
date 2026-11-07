import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
export const ADMIN_COOKIE = 'jannat_admin_token';
function secret(){const s=process.env.JWT_SECRET;if(!s||s.length<32)throw new Error('JWT_SECRET must be at least 32 characters');return s;}
export function createAdminToken(username:string){return jwt.sign({username,role:'admin'},secret(),{expiresIn:'7d'});}
export function verifyAdminToken(token:string){try{return (jwt.verify(token,secret()) as {role?:string}).role==='admin';}catch{return false;}}
export async function isAdmin(){const token=cookies().get(ADMIN_COOKIE)?.value;return !!token&&verifyAdminToken(token);}
