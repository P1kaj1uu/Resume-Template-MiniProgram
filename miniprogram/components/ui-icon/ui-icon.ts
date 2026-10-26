import icons = require('../../utils/icons');
Component({
  properties: {
    name: { type: String, value: 'file' },
    size: { type: Number, value: 36 },
    unit: { type: String, value: 'rpx' },
    filled: { type: Boolean, value: false },
    color: { type: String, value: '' },
    weight: { type: Number, value: 1.8 },
  },
  data: { src: '' },
  observers: {
    'name,filled,weight': function (name: string, filled: boolean, weight: number) {
      this.setData({ src: icons.source(name, filled, weight) });
    },
  },
});
