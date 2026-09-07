import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use((req: any, res: any, next: any) => {
    if (req.path === '/payments/webhook' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        req.rawBody = body;
        try {
          req.body = JSON.parse(body);
        } catch {
          req.body = {};
        }
        next();
      });
    } else {
      next();
    }
  });

  app.use(express.json({ limit: '10kb' }));

  app.use(mongoSanitize());

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  const allowedOrigins = [
    'https://matteekay.com',
    'https://www.matteekay.com',
    'https://mattekay.onrender.com',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 429,
      error: 'Too many requests, please try again later.',
    },
  });

  app.use('/api', apiLimiter);

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('matteekay Studio API')
      .setDescription('welcome to matteekay API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('items', 'Items management')
      .addTag('product-variants', 'Product variants management')
      .addTag('users', 'Users management')
      .addTag('orders', 'Orders management')
      .addTag('payments', 'Payments management')
      .addTag('admin', 'Admin dashboard')
      .addTag('slideshow', 'Slideshow management')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}`);
  if (!isProduction) {
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
