// mocks/canvas.js
class Canvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  getContext() {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(this.width * this.height * 4)
      })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(this.width * this.height * 4)
      })),
      drawImage: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn(() => ({ width: 10 })),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn()
      })),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      arc: jest.fn(),
      closePath: jest.fn(),
      clip: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
      setTransform: jest.fn(),
      createPattern: jest.fn(() => ({})),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn()
      }))
    };
  }

  toBuffer() {
    return Buffer.from([]);
  }

  toDataURL() {
    return 'data:image/png;base64,';
  }
}

module.exports = {
  Canvas,
  createCanvas: (width, height) => new Canvas(width, height),
  loadImage: jest.fn(() => Promise.resolve({}))
};
