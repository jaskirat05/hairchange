import { NextRequest, NextResponse } from 'next/server'; import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define which routes to protect const isProtectedRoute = createRouteMatcher(["/", "/credits(.*)"]);
const isProtectedRoute = createRouteMatcher(["/admin(.*)"]);    
export default clerkMiddleware((auth, req) => {   if (isProtectedRoute(req)) {     auth().protect({role: "admin"  });   } });

export const config = {   matcher: ["/((?!.\..|_next).)", "/", "/(api|trpc)(.)"], };