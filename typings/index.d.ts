/// <reference types="miniprogram-api-typings" />

/** App state; resume records remain in the device's local storage. */
interface IAppOption {
  globalData: {
    storageMode: 'local';
  };
}
