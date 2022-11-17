import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
} from '@nestjs/common';
import * as moment from 'moment';
import { environment } from '@app/env';
import { Request } from 'express';
  
  @Catch()
  export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const request: Request = ctx.getRequest();
      let user_agent: string = 'unknown';
      let ip: string = 'unknown';
      let code = -1;
      //@Get User Agent
      try {
        user_agent = request.headers['user-agent'];
      } catch (err) {}
      //@Get Ip Address
      try {
        ip = `x-forwarded-for: ${request.headers['x-forwarded-for']}, x-real-ip: ${request.headers['x-real-ip']}`;
      } catch (err) {}
      var status = HttpStatus.BAD_REQUEST;
      // console.log(exception)
      try {
        status = exception.getStatus();
      } catch (err) {
        status = HttpStatus.BAD_REQUEST;
      }
  
      var message = exception.response || exception.message;
      // console.log(exception.message)
      try {
        code = exception.response.hasOwnProperty('code')
          ? exception.response.code
          : code;
      } catch (err) {}
  
      if (typeof exception.message == 'object') {
        try {
          if (exception.message.message) {
            message = exception.message.message;
          }
        } catch (err) {}
        try {
          if (exception.message.error) {
            message = exception.message.error;
          }
        } catch (err) {}
      }
  
      let model = {
        statusCode: status,
        code: code,
        stack: exception.stack,
        message: message,
        dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        timestamp: Date.now(),
        path: request.url,
        ip: ip,
        userAgent: user_agent,
      };
      // console.log(model);
      if (environment.NODE_ENV == 'production') {
        if (
          `${model.message}`.search('ER_') !== -1 &&
          `${model.stack}`.search('Client_MySQL') !== -1
        ) {
          // model['message'] = `${model.message}`.substr(`${model.message}`.search('ER_'))
          model['message'] = '[Unknown][Query] Please check logs';
          model['stack'] = null;
        }
      }
      model['stack'] = null;
      response.status(status).json(model);
    }
  }
  