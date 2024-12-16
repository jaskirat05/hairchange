import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { constants } from 'perf_hooks'

const isProtectedRoute = createRouteMatcher(['/start','/stage(.*)'])  
const isPublicRoute = createRouteMatcher(['/api/webhook(.*)'])   
const isAdmin=createRouteMatcher(['/admin(.*)'])
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth().protect();

  if (isAdmin(req)) await auth().protect((has)=>{
    return has({role:'admin'})   
  })
  

}
)

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}