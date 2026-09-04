import app from './app';
import common from './app/common.json';
import core from './core';
import layout from './layout';
import page from './page';

export default {
  ...app,
  ...common,
  ...core,
  ...layout,
  ...page,
};
