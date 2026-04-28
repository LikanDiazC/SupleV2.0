const readline = require('readline');
const { google } = require('googleapis');
require('dotenv').config();

// Script interactivo para sacar el Refresh Token Permanente de Google Ads
async function run() {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("❌ Por favor configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en tu archivo .env");
    process.exit(1);
  }

  const REDIRECT_URI = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/comms/auth/callback';
  const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  // El permiso que nos exige Google Ads API
  const SCOPES = ['https://www.googleapis.com/auth/adwords'];

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', // Para que nos devuelva el REFRESH_TOKEN
    prompt: 'consent',      // Forzamos que vuelva a preguntar siempre
    scope: SCOPES,
  });

  console.log('\n================================');
  console.log('🔑 GENERADOR DE REFRESH TOKEN PARA ADS');
  console.log('================================');
  console.log('\n1. Abre este enlace exacto en tu navegador:');
  console.log(`\n-> ${authUrl}`);
  console.log('\n2. Inicia sesión con la cuenta dueña de Google Ads de Suple (likanaquilesdiazcalbuqueo@motioncontrol.cl)');
  console.log('3. Autoriza la aplicación.');
  console.log('4. Te redirigirá a http://localhost:3000/?code=4/0AeaY... (o dará error de que no se puede cargar la página local, ¡no te preocupes!)');
  console.log('5. Copia el parámetro "code=" de la barra de direcciones de esa página.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Pega el código autorizado aquí: ', async (code) => {
    try {
      console.log('\nIntercambiando código por tokens...');
      const { tokens } = await oAuth2Client.getToken(code);
      console.log('\n✅ ¡ÉXITO! Guarda este token en tu archivo .env como GOOGLE_ADS_REFRESH_TOKEN:\n');
      console.log(`GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}\n`);
      console.log('Luego de pegarlo en el .env, no olvides reiniciar el backend.\n');
    } catch (e) {
      console.error('\n❌ Hubo un error procesando el código. Asegúrate de pegarlo sin incluir "code=".');
      console.error(e.message);
    }
    rl.close();
  });
}

run();
