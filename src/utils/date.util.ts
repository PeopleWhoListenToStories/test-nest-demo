import { format as _dateFormat } from 'date-fns'

export const dateFormat = (date = null, format = 'yyyy-MM-dd HH:mm:ss') => {
  if (date === null || date === undefined) {
    date = new Date() // eslint-disable-line no-param-reassign
  }
  const t = date instanceof Date ? date : new Date(date)
  return _dateFormat(t, format)
}

export const dayFormat = (time) => {
  const nowtime = new Date()
  const future = new Date(time)
  const timeSum = future.getTime() - nowtime.getTime()
  const day = parseInt(timeSum / 1000 / 60 / 60 / 24 + '')
  // const hour = parseInt(((timeSum / 1000 / 60 / 60) % 24) + '');

  // const minu = parseInt(((timeSum / 1000 / 60) % 60) + '');
  // const sec = parseInt(((timeSum / 1000) % 60) + '');
  // var millsec = parseInt(timeSum%1000);

  return day < 10 ? '0' + day : day
  // return +(time - Date.now()) / 1000 / 60 / 60;
}
