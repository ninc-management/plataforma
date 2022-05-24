import { User, UserNotification } from '../models/user';
import { sendMail } from '../routes/email';

function createId(): string {
  const timestamp = ((new Date().getTime() / 1000) | 0).toString(16);
  return (
    timestamp +
    'xxxxxxxxxxxxxxxx'
      .replace(/[x]/g, function () {
        return ((Math.random() * 16) | 0).toString(16);
      })
      .toLowerCase()
  );
}

function port(port: string, fallback = '8080'): string {
  return !isNaN(+port) && +port >= 0 ? port : fallback;
}

export function isUserAuthenticated(req, res, next): boolean {
  const urlCheck = req.url.split('/').filter((el) => el.length > 0);
  if (urlCheck.length > 0 && urlCheck[0] == 'api') {
    if (req.headers.authorization == process.env.API_TOKEN) {
      next();
    } else {
      return res.status(401).json({
        message: 'Chave de autenticação da API invalida',
      });
    }
  } else next();
}

export function notifyByEmail(notification: UserNotification): void {
  const mailOptions = {
    from: 'Contato NINC <contato@ninc.digital>',
    to: (notification.to as User).email,
    subject: notification.title,
    html: '<p>' + notification.message + '</p>',
  };
  sendMail(mailOptions, (err, info) => {
    if (err) console.log('Erro envio de mail:', err);
  });
}

export default {
  mongoObjectId: createId,
  normalizePort: port,
};
