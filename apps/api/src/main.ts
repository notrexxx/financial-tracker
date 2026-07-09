import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable global validation strictly checking our DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips out properties that do not have any decorators
      forbidNonWhitelisted: true, // Throws an error if non-whitelisted properties are provided
      transform: true, // Automatically transforms payloads to be objects typed according to their DTO classes
    }),
  );

  // Enable CORS so our React frontend on port 5173 can talk to our API on port 3000
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 API Engine running on http://localhost:${port}`);
}
bootstrap();