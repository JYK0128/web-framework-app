import app from './app';
import core from './core';
import errors from './errors.json';
import service from './service.json';

export default { ...errors, ...app, ...core, service };
