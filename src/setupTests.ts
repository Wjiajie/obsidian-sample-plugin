import "@testing-library/jest-dom";

// 1. 模拟全局变量
global.fetch = jest.fn();

// 完整实现 Storage 接口
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  key: jest.fn(),
  length: 0,
  [Symbol.iterator]: jest.fn()
};

// 2. 添加自定义匹配器
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () => `expected ${received} to be within range ${floor} - ${ceiling}`
    };
  },
});

// 3. 设置测试环境变量
process.env.API_URL = 'http://localhost:3000';

// 4. 清理模拟函数
afterEach(() => {
  jest.clearAllMocks();
});
