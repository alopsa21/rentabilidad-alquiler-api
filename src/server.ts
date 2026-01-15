import 'dotenv/config';
import Fastify from 'fastify';

const server = Fastify({
  logger: true,
});

// Endpoint de healthcheck
server.get('/health', async () => {
  return { status: 'ok' };
});

// Iniciar el servidor
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    console.log(`🚀 Servidor API corriendo en http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
