module.exports = {
    apps: [
        {
            name: "Nitro Quiz",
            script: "node_modules/next/dist/bin/next",
            args: "start -p 3004",
            cwd: "./",
            exec_mode: "cluster",
            instances: "max",
            autorestart: true,
            watch: false,
            max_memory_restart: "3G",
            env: {
                NODE_ENV: "production",
            }
        }
    ]
}