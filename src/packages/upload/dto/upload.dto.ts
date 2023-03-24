import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';


export type validMimeType = 'image/png' | 'image/jpg' | 'image/jpeg';
export const validMimeTypes = [
    'image/png', 'image/jpg', 'image/jpeg'
]