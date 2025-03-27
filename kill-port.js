const { exec } = require('child_process');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get the port from command line arguments or prompt the user
const args = process.argv.slice(2);
let port = args[0];

function findAndKillProcess(port) {
  console.log(`Looking for processes using port ${port}...`);
  
  // Command to find the process using the port
  const findCommand = process.platform === 'win32'
    ? `netstat -ano | findstr :${port}`
    : `lsof -i :${port}`;
  
  exec(findCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error finding process: ${error.message}`);
      rl.close();
      return;
    }
    
    if (stderr) {
      console.error(`Command error: ${stderr}`);
      rl.close();
      return;
    }
    
    if (!stdout) {
      console.log(`No process found using port ${port}`);
      rl.close();
      return;
    }
    
    console.log('Found the following processes:');
    console.log(stdout);
    
    // Extract PID from the output
    let pid;
    if (process.platform === 'win32') {
      // Windows format: TCP/UDP  IP:PORT  IP:PORT  STATE  PID
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes(`:${port}`)) {
          const parts = line.trim().split(/\s+/);
          pid = parts[parts.length - 1];
          break;
        }
      }
    } else {
      // Unix format: COMMAND  PID  USER  FD  TYPE  DEVICE  SIZE/OFF  NODE  NAME
      const lines = stdout.split('\n');
      if (lines.length > 1) {
        const parts = lines[1].trim().split(/\s+/);
        pid = parts[1];
      }
    }
    
    if (!pid) {
      console.log('Could not determine the process ID');
      rl.close();
      return;
    }
    
    console.log(`Process ID: ${pid}`);
    
    rl.question(`Do you want to kill the process with PID ${pid}? (y/n) `, (answer) => {
      if (answer.toLowerCase() === 'y') {
        // Command to kill the process
        const killCommand = process.platform === 'win32'
          ? `taskkill /F /PID ${pid}`
          : `kill -9 ${pid}`;
        
        exec(killCommand, (killError, killStdout, killStderr) => {
          if (killError) {
            console.error(`Error killing process: ${killError.message}`);
            rl.close();
            return;
          }
          
          console.log(`Process with PID ${pid} has been killed`);
          console.log('You can now start your server on port ' + port);
          rl.close();
        });
      } else {
        console.log('Process not killed');
        rl.close();
      }
    });
  });
}

if (port) {
  findAndKillProcess(port);
} else {
  rl.question('Enter the port number: ', (answer) => {
    port = answer.trim();
    findAndKillProcess(port);
  });
}
