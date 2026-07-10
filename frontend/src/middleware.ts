import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Rotas públicas não precisam de autenticação
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Sem token → redireciona para login
  // Nota: o token também fica no localStorage; aqui usamos cookies para o middleware do servidor
  // O AuthContext garante a proteção no cliente para as demais rotas
  if (!token && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
