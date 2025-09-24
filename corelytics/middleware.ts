import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import axios from "axios"

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    
    // If user is authenticated but not on auth pages
    if (token && !req.nextUrl.pathname.startsWith('/auth/')) {
      // Check if user has a complete profile
      try {
        await axios.get(new URL('/api/profile', req.url).toString(), {
          headers: {
            Cookie: req.headers.get('cookie') || '',
          },
        })
      } catch (error) {
        // If profile doesn't exist (404) and user is not already on complete_profile page
        if (axios.isAxiosError(error) && error.response?.status === 404 && req.nextUrl.pathname !== '/auth/complete_profile') {
          return NextResponse.redirect(new URL('/auth/complete_profile', req.url))
        }
        // If there's any other error checking the profile, continue to the requested page
        console.error('Error checking user profile:', error)
      }
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages and API routes without authentication
        if (req.nextUrl.pathname.startsWith('/auth/') || req.nextUrl.pathname.startsWith('/api/')) {
          return true
        }
        
        // For all other pages, require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g., images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
