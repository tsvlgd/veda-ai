import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Ensure the host header matches the origin for CSRF validation
  // Render's reverse proxy can mismatch these, causing Next.js to reject with 403
  const origin = request.headers.get('origin')
  if (origin) {
    const originHost = new URL(origin).host
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-forwarded-host', originHost)
    requestHeaders.set('host', originHost)

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.*|apple-icon.*).*)'],
}
