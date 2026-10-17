import dotenv from 'dotenv';
dotenv.config();

import { createServer } from './server.js';

const PORT = process.env.PORT || 5000;
const { server } = createServer();

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  CareQ — Smart Hospital Patient Queue System Backend  `);
  console.log(`  Server running on http://localhost:${PORT}          `);
  console.log(`  Healthcheck: http://localhost:${PORT}/health        `);
  console.log(`=======================================================`);
});
