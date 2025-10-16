const { Client } = require('ssh2');
const { decrypt } = require('./encryption');

async function executeOnServer(server, command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';
    let errorOutput = '';

    conn.on('ready', () => {
      console.log(`✅ SSH connection established to ${server.host}`);

      // Eğer sudo_password varsa ve komut sudo ile başlamıyorsa, sudo ekle
      let finalCommand = command;
      const sudoPassword = server.sudo_password ? decrypt(server.sudo_password) : null;

      if (sudoPassword && !command.trim().startsWith('sudo')) {
        // Güvenli escape için şifreyi değişkene at ve printf kullan
        // Bu yöntem özel karakterleri (', ", $, `, \, vb.) güvenli şekilde handle eder
        const escapedPassword = sudoPassword.replace(/'/g, "'\\''"); // Single quote escape
        finalCommand = `printf '%s\\n' '${escapedPassword}' | sudo -S -p '' bash -c "${command.replace(/"/g, '\\"')}"`;
      }

      conn.exec(finalCommand, (err, stream) => {
        if (err) {
          conn.end();
          return reject(new Error(`Execution error: ${err.message}`));
        }

        let promptHandled = false;

        stream.on('close', (code) => {
          conn.end();

          // Sudo şifre promptunu output'tan temizle
          if (sudoPassword) {
            output = output.replace(/\[sudo\] password for .*?:\s*/g, '');
            errorOutput = errorOutput.replace(/\[sudo\] password for .*?:\s*/g, '');
          }

          if (code === 0) {
            resolve({
              success: true,
              output: output.trim(),
              exitCode: code
            });
          } else {
            reject(new Error(`Command failed with exit code ${code}: ${errorOutput || output}`));
          }
        });

        stream.on('data', (data) => {
          const dataStr = data.toString();
          output += dataStr;

          // İlk sudo promptunu broadcast etme
          if (!promptHandled && sudoPassword && dataStr.includes('password')) {
            promptHandled = true;
            return;
          }

          // Real-time log broadcast
          if (global.broadcastLog) {
            global.broadcastLog({
              type: 'output',
              server: server.name,
              data: dataStr
            });
          }
        });

        stream.stderr.on('data', (data) => {
          const dataStr = data.toString();
          errorOutput += dataStr;

          // Sudo prompt hatalarını ayıkla
          if (sudoPassword && (dataStr.includes('sudo:') || dataStr.includes('password'))) {
            return;
          }

          if (global.broadcastLog) {
            global.broadcastLog({
              type: 'error',
              server: server.name,
              data: dataStr
            });
          }
        });
      });
    });

    conn.on('error', (err) => {
      reject(new Error(`SSH connection error: ${err.message}`));
    });

    // Decrypt password if exists
    const password = server.password ? decrypt(server.password) : undefined;

    const config = {
      host: server.host,
      port: server.port || 22,
      username: server.username,
      readyTimeout: 30000,
      keepaliveInterval: 10000
    };

    // Password veya private key kullan
    if (password) {
      config.password = password;
    } else if (server.private_key) {
      config.privateKey = decrypt(server.private_key);
    }

    conn.connect(config);
  });
}

async function executeOnMultipleServers(servers, command, parallel = true) {
  const results = [];

  if (parallel) {
    // Paralel çalıştır
    const promises = servers.map(async (server) => {
      try {
        const result = await executeOnServer(server, command);
        return {
          serverId: server.id,
          serverName: server.name,
          status: 'success',
          ...result
        };
      } catch (error) {
        return {
          serverId: server.id,
          serverName: server.name,
          status: 'error',
          error: error.message
        };
      }
    });

    return await Promise.all(promises);
  } else {
    // Sıralı çalıştır
    for (const server of servers) {
      try {
        const result = await executeOnServer(server, command);
        results.push({
          serverId: server.id,
          serverName: server.name,
          status: 'success',
          ...result
        });
      } catch (error) {
        results.push({
          serverId: server.id,
          serverName: server.name,
          status: 'error',
          error: error.message
        });
      }
    }
    return results;
  }
}

// Test SSH connection
async function testConnection(server) {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn.on('ready', () => {
      conn.end();
      resolve({ success: true, message: 'Connection successful' });
    });

    conn.on('error', (err) => {
      reject(new Error(`Connection failed: ${err.message}`));
    });

    const password = server.password ? decrypt(server.password) : undefined;

    const config = {
      host: server.host,
      port: server.port || 22,
      username: server.username,
      readyTimeout: 10000
    };

    if (password) {
      config.password = password;
    } else if (server.private_key) {
      config.privateKey = decrypt(server.private_key);
    }

    conn.connect(config);
  });
}

module.exports = {
  executeOnServer,
  executeOnMultipleServers,
  testConnection
};