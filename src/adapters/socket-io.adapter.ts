// import { IoAdapter } from '@nestjs/platform-socket.io';
// import { INestApplicationContext } from '@nestjs/common';
// import { ServerOptions } from 'socket.io';

// export class SocketIoAdapter extends IoAdapter {
//   constructor(app: INestApplicationContext) {
//     super(app);
//   }

//   createIOServer(port: number, options?: ServerOptions): any {
//     const server = super.createIOServer(port, {
//       cors: {
//         origin: '*', // или укажи конкретный frontend-домен
//       },
//       ...options,
//     });
//     return server;
//   }
// }
