import { NextRequest, NextResponse } from 'next/server'; import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define which routes to protect const isProtectedRoute = createRouteMatcher(["/", "/credits(.*)"]);
const isProtectedRoute = createRouteMatcher(["/admin(.*)"]);    
const isPublicRoute = createRouteMatcher(["/api/webhook"]);  
export default clerkMiddleware((auth, req) => {    
    if (isPublicRoute(req)) {
    return NextResponse.next();}

    if (isProtectedRoute(req))  {     
        auth().protect({role: "admin"  });   } 
        
    });

    export const config = {
        matcher: [
            "/((?!_next/static|_next/image|favicon.ico).*)",
            "/",
            "/api/:path*"
        ]
    };