import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { BotService } from './bot/bot.service';
import * as express from 'express';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import * as fs from 'fs';
// import * as path from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.use(express.json());

    // Configure CORS with specific options
    app.enableCors({
      origin: true, // Allow all origins
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: 'Content-Type, Accept, Authorization',
    });

    // Save Swagger JSON file
    // const outputPath = path.resolve(process.cwd(), 'swagger.json');
    // fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), {
    //   encoding: 'utf8',
    // });
    // logger.log(`📝 Swagger JSON saved to ${outputPath}`);

    // Setup Swagger UI with custom options
    // Configure Swagger to include all Prisma models
    // const config = new DocumentBuilder()
    //   .setTitle('API Documentation')
    //   .setDescription('The API description')
    //   .setVersion('1.0')
    //   .addBearerAuth()
    //   .addTag('Characters')
    //   .addTag('Game')
    //   .build();

    // const document = SwaggerModule.createDocument(app, config, {
    //   deepScanRoutes: true,
    //   operationIdFactory: (controllerKey: string, methodKey: string) =>
    //     methodKey,
    // });

    // // Setup Swagger UI with enhanced model visibility
    // SwaggerModule.setup('api', app, document, {
    //   swaggerOptions: {
    //     persistAuthorization: true,
    //     filter: true,
    //     displayRequestDuration: true,
    //     docExpansion: 'none',
    //     defaultModelsExpandDepth: 2, // Show more model details
    //     defaultModelExpandDepth: 2,
    //     displayOperationId: true,
    //     tryItOutEnabled: true,
    //   },
    //   customSiteTitle: 'Guess Character API Documentation',
    //   customCss: '.swagger-ui .topbar { display: none }',
    //   customJs: [
    //     'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
    //   ],
    //   customCssUrl: [
    //     'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    //   ],
    // });

    // // Add endpoint to serve Swagger JSON with proper headers
    // expressApp.get('/api-json', (req, res) => {
    //   res.setHeader('Content-Type', 'application/json');
    //   res.setHeader('Access-Control-Allow-Origin', '*');
    //   res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    //   res.json(document);
    // });

    const botService = app.get(BotService);
    await botService.setupWebhook(expressApp);

    const port = process.env.PORT || 3001;
    await app.listen(port);
    logger.log(`🚀 Server running on http://localhost:${port}`);
    // logger.log(
    //   `📚 Swagger documentation available at http://localhost:${port}/api`,
    // );
    // logger.log(
    //   `📝 Swagger JSON available at http://localhost:${port}/api-json`,
    // );
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();
