// server.js
/* eslint-disable import/order */
const app = require('./backend/app').default;

const debug = require('debug')('node-angular');
const http = require('http');
const util = require('./backend/shared/util').default;
/* eslint-enable import/order */

const onError = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const onListening = () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + port;
  debug('Listening on ' + bind);
};

const port = util.normalizePort(process.env.PORT);
console.log('App now running on port', port);
app.api.express.set('port', port);

const server = http.createServer(app.api.express);
server.on('error', onError);
server.on('listening', onListening);
server.listen(port);

const io = require('socket.io')(server, {
  path: '/api/socket.io',
  transports: ['websocket'],
});

const connMap = {};

const dbWatcher$ = app.db.watch();

dbWatcher$.on('change', (data) => {
  app.api.lastChanges.queue(data);
});

io.on('connection', (socket) => {
  console.log('Nova conexao', socket.id, socket.client.conn.id);
  connMap[socket.id] = app.api.lastChanges.inserted$.subscribe((data) => {
    socket.emit('dbchange', data);
  });

  socket.on('disconnect', (socket) => {
    if (connMap[socket.id]) {
      console.log('Encerrando conexao', socket.id);
      connMap[socket.id].unsubscribe();
      delete connMap[socket.id];
    }
  });
});
