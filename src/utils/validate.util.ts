/**
 * @description 11位手机号码正则
 * @param { string } value
 * @returns { boolean } boolean
 */
export const isMobile = (value: string): boolean => {
  return /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/.test(value)
}
