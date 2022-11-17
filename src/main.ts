import { Module, ValidationPipe, Controller, All, HttpStatus, HttpException, MiddlewareConsumer } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { RouterModule } from 'nest-router';
import { environment, version } from '@app/env';

import { getHeapStatistics } from 'v8';
import * as express from 'express';
import * as compression from 'compression';
import * as os from 'os';
import { join } from 'path';
import { AllExceptionsFilter } from '@app/filters/exception.filter';
import 'ejs'

// impor route
import { routes } from './routes';

process.on('uncaughtException', function (reason, p) {
  //call handler here
  console.log(reason, p);
});

let modules = []
for (let module of routes) {
  modules.push(module.module)
}

@Controller()
class mainController {
  constructor() {
    if (environment.NODE_ENV !== 'development') {
      // listen for TERM signal .e.g. kill
      process.on('SIGTERM', () => {
        this.gracefulShutdown();
      });
      // listen for INT signal e.g. Ctrl-C
      process.on('SIGINT', () => {
        this.gracefulShutdown();
      });
    }
  }

  signal_gracefulShutdown: boolean = false;

  gracefulShutdown() {
    //console.log(environment.NODE_ENV)
    this.signal_gracefulShutdown = true;
    setTimeout(() => {
      process.exit(0);
    }, environment.gracefulShutdownTime * 1000);
  }

  @All('pod_status')
  health() {
    // throw new HttpError(resCode.SERVICE_UNAVAILABLE)
    if (!this.signal_gracefulShutdown) {
      return { version: version, status: HttpStatus.OK, host: os.hostname() };
    }
    throw new HttpException("SERVICE_UNAVAILABLE", HttpStatus.SERVICE_UNAVAILABLE)
  }

}

@Module({
  imports: [
    RouterModule.forRoutes(routes),
    ...modules
  ],
  controllers: [
    mainController
  ],
  providers: [],
})
export class mainModule {
  // configure(consumer: MiddlewareConsumer) {
  // 	consumer
  // 		.apply(RequestMiddleware).forRoutes('**')
  // }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(mainModule);
  app.use(express.json({ limit: environment.body_size }));
  app.use(express.urlencoded({ limit: environment.body_size, extended: true }));
  app.enableCors();
  app.use(compression())
  app.use(express.static("./public"));
  app.setBaseViewsDir(join(process.cwd(), 'views'));
  app.setViewEngine('ejs');
  app.setGlobalPrefix(`/api/v1`);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(environment.PORT).finally(() => {
    console.log("Server API is Running");
    console.log("Worker " + process.pid + " is alive!");
    console.log('PORT', environment.PORT);
    console.log('NODE_ENV', environment.NODE_ENV)
    console.log('cwd path', process.cwd())
    console.log('HOST_NAME', os.hostname())
    console.log('OS', os.platform())
    console.log('##########')
    try {
      console.log(`node heap limit = ${getHeapStatistics().heap_size_limit / (1024 * 1024)} Mb`)
    } catch (err) {
      console.log('node heap limit log error')
    }
  });
}
bootstrap();
