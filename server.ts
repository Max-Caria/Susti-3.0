import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Configurazione Nodemailer (SMTP)
// Esempio con Gmail, ma può essere qualsiasi provider SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Configurazione Google Sheets
// Richiede le credenziali del Service Account in formato JSON
let sheetsAuth;
try {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    sheetsAuth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
  }
} catch (error) {
  console.error("Errore configurazione Google Sheets:", error);
}

const sheets = google.sheets({ version: 'v4', auth: sheetsAuth });

app.post('/api/submit-lead', async (req, res) => {
  try {
    const { lead, auditType, stats, answers } = req.body;

    // 1. Salva su Google Sheets (se configurato)
    if (sheetsAuth && process.env.GOOGLE_SHEET_ID) {
      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: 'Leads!A:Z', // Assicurati che il foglio si chiami "Leads"
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [
              [
                new Date().toISOString(),
                lead.nome,
                lead.email,
                lead.ruolo,
                lead.tipoOrg,
                auditType,
                stats.totalScore,
                stats.pillarScores.E,
                stats.pillarScores.S,
                stats.pillarScores.G,
                lead.newsletter ? 'Sì' : 'No'
              ]
            ]
          }
        });
        console.log("Lead salvato su Google Sheets");
      } catch (sheetError) {
        console.error("Errore salvataggio Google Sheets:", sheetError);
      }
    } else {
      console.log("Simulazione: Salvataggio su Google Sheets saltato (credenziali mancanti). Dati:", lead.email);
    }

    // 2. Invia Email Profilata (se configurato)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        // Email all'utente
        await transporter.sendMail({
          from: `"Territori Sostenibili" <${process.env.SMTP_USER}>`,
          to: lead.email,
          subject: `Il tuo Executive Report SUSTI® - ${lead.tipoOrg}`,
          html: `
            <h2>Ciao ${lead.nome},</h2>
            <p>Grazie per aver completato l'assessment SUSTI® per la tua organizzazione.</p>
            <p>Il tuo Global Score è: <strong>${stats.totalScore}/100</strong></p>
            <ul>
              <li>Ambiente: ${stats.pillarScores.E}/100</li>
              <li>Sociale: ${stats.pillarScores.S}/100</li>
              <li>Governance: ${stats.pillarScores.G}/100</li>
            </ul>
            <p>Il nostro team di esperti analizzerà i tuoi risultati e ti contatterà a breve per discutere le opportunità di miglioramento.</p>
            <br/>
            <p>Un cordiale saluto,<br/>Il Team di Territori Sostenibili</p>
          `
        });

        // Email al team interno
        await transporter.sendMail({
          from: `"SUSTI® System" <${process.env.SMTP_USER}>`,
          to: process.env.INTERNAL_NOTIFICATION_EMAIL || process.env.SMTP_USER,
          subject: `Nuovo Lead SUSTI®: ${lead.nome} (${lead.tipoOrg})`,
          html: `
            <h2>Nuovo Lead Generato</h2>
            <p><strong>Nome:</strong> ${lead.nome}</p>
            <p><strong>Email:</strong> ${lead.email}</p>
            <p><strong>Ruolo:</strong> ${lead.ruolo}</p>
            <p><strong>Organizzazione:</strong> ${lead.tipoOrg}</p>
            <p><strong>Tipo Audit:</strong> ${auditType}</p>
            <p><strong>Score:</strong> ${stats.totalScore}/100 (E: ${stats.pillarScores.E}, S: ${stats.pillarScores.S}, G: ${stats.pillarScores.G})</p>
            <p><strong>Newsletter:</strong> ${lead.newsletter ? 'Sì' : 'No'}</p>
          `
        });
        console.log("Email inviate con successo");
      } catch (emailError) {
        console.error("Errore invio email:", emailError);
      }
    } else {
      console.log(`Simulazione: Invio email saltato (credenziali SMTP mancanti). Email destinata a: ${lead.email}`);
    }

    res.status(200).json({ success: true, message: 'Lead elaborato con successo' });
  } catch (error) {
    console.error("Errore elaborazione lead:", error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = parseInt(process.env.PORT || '3000', 10);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
