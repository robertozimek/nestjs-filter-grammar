import 'reflect-metadata';
import { FILTERABLE_KEY } from './constants';

export function Filterable(): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(FILTERABLE_KEY, true, target);
  };
}
