/*
https://docs.nestjs.com/controllers#controllers
*/

import { lab_models } from '@app/database/lab';
import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, Query } from '@nestjs/common';
import { merge } from 'lodash';
import { ownerDto } from './dto/todo.dto';

@Controller()
export class TodoController {

    // @Post('owner')
    // async getOwner(@Body() input:ownerDto){
    //     // throw new HttpException(['Title is required'], 404)
    //     return input;
    // }
    // @Post('create')
    // async create(@Body() input: {
    //     title: string
    // }) {

    //     input = merge({
    //         title: ""
    //     }, input || {})

    //     // check if title is empty
    //     if (input.title === "") throw new HttpException('Title is required', 400);

    //     let todoModel = new lab_models.Todos({
    //         title: input.title
    //     });

    //     await todoModel.save();

    //     return {
    //         res_code: 200,
    //         message: "success"
    //     }
    // }

    // @Put('update/:id')
    // async update(@Body() input: {
    //     title: string
    // }, @Param('id') id: string) {
            
    //     input = merge({
    //         title: ""
    //     }, input || {})
    //     // check if title is empty
    //     if (input.title === "") throw new HttpException('Title is required', 400);
    //     let todoModel = await new lab_models.Todos().where('id', id).fetch();
    //     // if todo not found
    //     if (!todoModel) throw new HttpException('Todo not found', 404);
    //     await todoModel.save({
    //         title: input.title
    //     }, { patch: true, method: 'update' });

    //     return {
    //         res_code: 200,
    //         message: "success"
    //     }

    // }

    // @Put('is_complete/:id')
    // async complete(@Param('id') id: string, @Body() input: {
    //     is_complete: boolean
    // }) {
    //     // check if id is empty
    //     if (id === "") throw new HttpException('Id is required', 400);
    //     let todoModel = await new lab_models.Todos().where('id', id).fetch();
    //     // if todo not found
    //     if (!todoModel) throw new HttpException('Todo not found', 404);
    //     await todoModel.save({
    //         status: input.is_complete?1:0
    //     }, { method: 'update' })
    //     return todoModel.toJSON();
    // }

    // @Delete('delete/:id')
    // async delete(@Param('id') id: string) {

    //     // check if id is empty
    //     if (id === "") throw new HttpException('Id is required', 400);

    //     let todoModel = await new lab_models.Todos().where('id', id).fetch();
    //     // if todo not found
    //     if (!todoModel) throw new HttpException('Todo not found', 404);
    //     await todoModel.destroy();
    //     return {
    //         res_code: 200,
    //         message: "success"
    //     }
    // }
    

    // @Get('list')
    // async list(@Query('page') page: number = 1, @Query('page_size') page_size: number = 10) {

    //     // merge default page and page_size
    //     page = page || 1;
    //     page_size = page_size || 10;

    //     let todoModel = new lab_models.Todos()
    //     let query = todoModel.query(qb => {
    //         qb.orderBy('created_at', 'DESC');
    //     })
        
    //     let queryData = await query.clone().fetchPage({
    //         page: page,
    //         pageSize: page_size
    //     })

    //     return {
    //         data: queryData.toJSON(),
    //         count: await query.clone().count().catch(() => 0)
    //     }
    // }

    // @Get('detail/:id')
    // async detail(@Param('id') id: string) {
    //     // check if id is empty
    //     if (id === "") throw new HttpException('Id is required', 400);
    //     let todoModel = await new lab_models.Todos().where('id', id).fetch();
    //     // if todo not found
    //     if (!todoModel) throw new HttpException('Todo not found', 404);
    //     return todoModel.toJSON();
    // }


}
