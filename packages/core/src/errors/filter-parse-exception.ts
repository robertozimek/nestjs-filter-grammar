import { BadRequestException } from '@nestjs/common';
import { FilterError } from '../types';

export class FilterParseException extends BadRequestException {
  constructor(public readonly errors: FilterError[]) {
    super({
      message: 'Invalid filter expression',
      errors,
    });
  }
}
