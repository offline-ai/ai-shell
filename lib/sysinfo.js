import os from 'os'
import { exec } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import {osInfo, cpu, shell} from 'systeminformation'

export async function getSysInfo() {
  const osinfo = await osInfo()
  const cpuInfo = await cpu()

  return { os: osinfo, cpu: cpuInfo, wsl: !!process.env.WSL_DISTRO_NAME }
}

export async function getSysInfoStr(sysInfo) {
  if (!sysInfo) sysInfo = await getSysInfo()
  const osinfo = sysInfo.os
  const cpuInfo = sysInfo.cpu

  const result = 'operating system: ' + osinfo.platform + '\n'
    + 'distro: ' + osinfo.distro + '\n'
    + 'release: ' + osinfo.release + '\n'
    + (osinfo.codename ? 'codename: ' + osinfo.codename + '\n' : '')
    + `processor: ${cpuInfo.manufacturer} ${cpuInfo.brand} ${cpuInfo.speed ? cpuInfo.speed + 'GHz' : ''}\n`
    + 'wsl: ' + (sysInfo.wsl ? 'yes' : 'no') + '\n'
  return result
}

export async function which(command) {
  try {
    if (os.platform() === 'win32') {
      const whereResult = await new Promise((resolve, reject) => {
        exec(`where ${command}`, (error, stdout, stderr) => {
          if (error) {
            resolve();
          } else {
            resolve(stdout.trim());
          }
        });
      });

      if (whereResult) return whereResult;
    } else {
      const result = await new Promise((resolve, reject) => {
        exec(`which ${command}`, (error, stdout, stderr) => {
          if (error) {
            resolve();
          } else {
            resolve(stdout.trim());
          }
        });
      });
      if (result) return result;
    }

    const paths = process.env.PATH.split(path.delimiter);
    for (const dir of paths) {
      const filePath = path.join(dir, command);
      try {
        await fs.access(filePath, fs.constants.X_OK);
        return filePath;
      } catch (e) {
        continue;
      }
    }

    return
  } catch (error) {
    console.error('Error occurred:', error);
    return
  }
}

export async function getShellName() {
  let result = process.env.SHELL
  if (!result) {
    result = await shell()
  }
  return result
}
export async function getShellVer() {
  const shell = process.env.SHELL
  const shellName = path.basename(shell)
  const result = await new Promise((resolve, reject) => {
    if (shellName === 'powershell') {
      exec(shell + ' -Command $PSVersionTable.PSVersion', (error, stdout, stderr) => {
        if (error) {
          reject(error)
        } else {
          resolve(stdout.trim())
        }
      })
    } else {
      exec(shell + ' --version', (error, stdout, stderr) => {
        if (error) {
          reject(error)
        } else {
          resolve(stdout.split('\n')[0].trim())
        }
      })
    }
  })
  return result
}

export async function getPackageManagers() {
  const package_managers = [
    "pip",
    "conda",
    "npm",
    "pnpm",
    "yarn",
    "gem",
    "apt",
    "dnf",
    "yum",
    "pacman",
    "zypper",
    "brew",
    "choco",
    "scoop",
    "winget",
  ]
  const result = []
  for (const package_manager of package_managers) {
    const is_installed = await which(package_manager)
    if (is_installed) {
      result.push(package_manager)
    }
  }
  return result
}

export async function initializeModule() {
  this.os = os.type()
  this.system_info = await getSysInfoStr()
  this.shell = path.basename(process.env.SHELL)
  if (!this.shell) {
    this.shell = await shell()
  }
  this.shell_version = await getShellVer()
  this.working_directory = process.cwd()
  this.sudo = (await which('sudo')) ? 'sudo' : 'no sudo'
  const pms = await getPackageManagers()
  if (pms && pms.length) {
    this.package_managers = pms.join(', ')
  }
  if (!this.content) this.content = this[0]
}
