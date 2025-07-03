module.exports = {
  apps: [
    {
      name: 'impactflow-next',
      script: 'npm',
      args: 'run dev',
      watch: ['src', 'public'],
      ignore_watch: ['node_modules', '.next', 'out', 'build', '.git'],
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      autorestart: true,
      watch_delay: 1000,
      max_memory_restart: '1G'
    },
    {
      name: 'impactflow-socket',
      script: './server.js',
      watch: ['server.js', 'src/server'],
      ignore_watch: ['node_modules', '.next', 'out', 'build', '.git'],
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      autorestart: true,
      watch_delay: 1000
    }
  ]
}