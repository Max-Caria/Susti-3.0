// Posizionamento del file:
// Questo file 'middleware.ts' va posizionato nella ROOT del progetto.
// Vercel lo rileverà automaticamente come Edge Middleware durante il deployment.

export const config = {
  // Applica il middleware a tutte le route, escludendo i file statici con estensione
  // per evitare richieste di autenticazione multiple per immagini, css, js.
  matcher: '/((?!.*\\.).*)',
};

export default function middleware(request: Request) {
  const basicAuth = request.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    
    if (authValue) {
      // Decodifica le credenziali (atob è supportato nativamente in Edge Runtime)
      const [user, pwd] = atob(authValue).split(':');

      const validUser = process.env.BASIC_AUTH_USER;
      const validPwd = process.env.BASIC_AUTH_PWD;

      // Se le variabili d'ambiente non sono configurate, permetti l'accesso
      // (utile per evitare di bloccare l'app se dimentichi di settarle su Vercel)
      if (!validUser || !validPwd) {
        return; 
      }

      // Verifica le credenziali
      if (user === validUser && pwd === validPwd) {
        return; // Continua l'esecuzione normale
      }
    }
  }

  // Se le credenziali sono assenti o errate, restituisci 401
  return new Response('Autenticazione richiesta', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
