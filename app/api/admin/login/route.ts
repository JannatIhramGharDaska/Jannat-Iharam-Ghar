import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createAdminToken, ADMIN_COOKIE } from '@/lib/auth';
export async function POST(req:Request){try{const {username,password}=await req.json();if(typeof username!=='string'||typeof password!=='string'||!username||!password)return NextResponse.json({success:false,message:'Username and password are required.'},{status:400});const admin=await prisma.admin.findUnique({where:{username}});if(!admin||!(await bcrypt.compare(password,admin.password)))return NextResponse.json({success:false,message:'Invalid username or password.'},{status:401});const res=NextResponse.json({success:true});res.cookies.set(ADMIN_COOKIE,createAdminToken(username),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:604800});return res;}catch(e){console.error(e);return NextResponse.json({success:false,message:'Server configuration error.'},{status:500});}}
export async function DELETE(){const res=NextResponse.json({success:true});res.cookies.set(ADMIN_COOKIE,'',{httpOnly:true,path:'/',maxAge:0});return res;}
