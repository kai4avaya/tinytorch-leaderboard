const { spawn } = require('child_process');
const waitOn = require('wait-on');

let server;

beforeAll(async () => {
  server = spawn('npm', ['run', 'dev']);
  await waitOn({ resources: ['http://localhost:3000'], timeout: 60000 });
});

afterAll(() => {
  server.kill();
});
