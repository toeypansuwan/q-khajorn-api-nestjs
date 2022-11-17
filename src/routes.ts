import { TodoModule } from '@app/packages/Todo/todo.module';
import { Routes } from 'nest-router';
import { AuthModule } from './packages/auth/auth.module';
import { LineModule } from './packages/line/line.module';
import { UsersModule } from './packages/user/users.module';

// global prefix => /api/v1
// ex. https://domain.com/api/v1/todos

export const routes: Routes = [
    {
        path: 'todos',
        module: TodoModule
    },
    {
        path: 'user',
        module: UsersModule
    },
    {
        path: 'auth',
        module: AuthModule
    },
    {
        path: 'line',
        module: LineModule
    }

]