import auth from './auth.json';
import errors from './errors.json';
import notifications from './notifications.json';
import service from './service.json';

export default { ...errors, app: { ...notifications, ...auth }, service };
