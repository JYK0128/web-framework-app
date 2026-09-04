import dataGrid from './data-grid.json';
import form from './form.json';
import stepForm from './step-form.json';
import validation from './validation.json';

export default {
  core: {
    ...dataGrid,
    ...form,
    ...stepForm,
  },
  ...validation,
};
