'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Script from 'next/script';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (notification?: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

// Definir el tipo de la notificación de Google
interface GoogleNotification {
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => string;
  isSkippedMoment: () => boolean;
  getSkippedReason: () => string;
  isDismissedMoment: () => boolean;
  getDismissedReason: () => string;
}

export default function GoogleOneTap() {
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Solo mostrar en la página principal y no en rutas protegidas
  const isHomePage = pathname === '/';
  const isAuthRoute = pathname?.includes('/sign-in') || pathname?.includes('/sign-up') || pathname?.includes('/auth/');
  const isProtectedRoute = pathname?.includes('/(protected)/');
  const shouldShowOneTap = isHomePage && !isProtectedRoute && !isAuthRoute;

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        setIsAuthenticated(!!data.session);
      } catch (error) {
        console.error('Error verificando autenticación:', error);
      }
    };
    
    checkAuth();
  }, []);

  // Manejar la respuesta de Google
  const handleGoogleResponse = async (response: any) => {
    if (!response?.credential) {
      console.error('No se recibió credencial de Google');
      return;
    }

    try {
      const supabase = createClient();
      
      // Iniciar sesión con el token ID proporcionado por Google
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });
      
      if (error) {
        console.error('Error iniciando sesión con Google One Tap:', error);
        return;
      }
      
      if (data.user) {
        console.log('Autenticación exitosa con Google One Tap');
        router.refresh();
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error procesando la autenticación:', error);
    }
  };

  // Inicializar Google One Tap
  useEffect(() => {
    if (!googleLoaded || isAuthenticated || !shouldShowOneTap) return;

    // Configurar Google One Tap solo cuando Google esté cargado
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
        callback: handleGoogleResponse,
        auto_select: true,
      });

      // Mostrar el prompt de One Tap
      setTimeout(() => {
        try {
          window.google?.accounts.id.prompt((notification: GoogleNotification) => {
            if (notification.isNotDisplayed()) {
              console.log('One Tap no mostrado:', notification.getNotDisplayedReason());
            }
          });
        } catch (e) {
          console.error('Error mostrando Google One Tap:', e);
        }
      }, 1000);
    }
  }, [googleLoaded, isAuthenticated, shouldShowOneTap, router]);

  if (!shouldShowOneTap || isAuthenticated) {
    return null;
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={() => setGoogleLoaded(true)}
        strategy="afterInteractive"
      />
    </>
  );
} 