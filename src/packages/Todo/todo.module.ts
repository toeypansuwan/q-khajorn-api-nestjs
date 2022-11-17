import { TodoController } from './todo.controller';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [TodoController],
  providers: [],
})
export class TodoModule {}
