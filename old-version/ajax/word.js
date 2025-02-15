import { get } from './ajax_base.js';

function getTodayWord(successFunction, errorFunction) {
  get('word', { },
    successFunction,
    errorFunction,
    false
  );
}

export {
  getTodayWord
}