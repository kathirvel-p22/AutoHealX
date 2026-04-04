// ============================================================
// AutoHealX — Device Pairing System
// Generates pairing codes for secure device registration
// ============================================================

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class DevicePairing {
  constructor() {
    this.pairingCode = null;
    this.deviceId = null;
    this.isRegistered = false;
    this.configPath = path.join(__dirname, '../config/deviceConfig.json');
    this.loadDeviceConfig();
  }

  /**
   * Load existing device configuration
   */
  loadDeviceConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.deviceId = config.deviceId;
        this.isRegistered = config.isRegistered || false;
        
        if (this.isRegistered) {
          console.log(chalk.green(`✅ Device registered: ${this.deviceId}`));
        }
      }
    } catch (error) {
      console.warn('Failed to load device config:', error.message);
    }
  }

  /**
   * Save device configuration
   */
  saveDeviceConfig() {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      const config = {
        deviceId: this.deviceId,
        isRegistered: this.isRegistered,
        pairingCode: this.pairingCode,
        registeredAt: this.isRegistered ? new Date().toISOString() : null,
        hostname: require('os').hostname(),
        platform: process.platform
      };

      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Failed to save device config:', error.message);
    }
  }

  /**
   * Generate a 6-character pairing code
   */
  generatePairingCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Start pairing process
   */
  async startPairing() {
    if (this.isRegistered) {
      console.log(chalk.yellow('📱 Device already registered'));
      return;
    }

    this.pairingCode = this.generatePairingCode();
    this.deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save pairing info
    this.saveDeviceConfig();

    // Register device in Firebase/local storage for pairing
    await this.registerForPairing();

    console.log(chalk.blue('\n🔗 DEVICE PAIRING'));
    console.log(chalk.blue('═══════════════════════════════════════'));
    console.log(chalk.white('To connect this device to your dashboard:'));
    console.log(chalk.white('1. Open AutoHealX Dashboard'));
    console.log(chalk.white('2. Click "Add Device"'));
    console.log(chalk.white('3. Enter this pairing code:'));
    console.log(chalk.green.bold(`\n   ${this.pairingCode}\n`));
    console.log(chalk.gray('Code expires in 10 minutes'));
    console.log(chalk.blue('═══════════════════════════════════════\n'));

    // Set expiration timer
    setTimeout(() => {
      if (!this.isRegistered) {
        console.log(chalk.yellow('⏰ Pairing code expired. Restart agent to get new code.'));
        this.pairingCode = null;
        this.saveDeviceConfig();
      }
    }, 10 * 60 * 1000); // 10 minutes
  }

  /**
   * Register device for pairing in Firebase/local storage
   */
  async registerForPairing() {
    try {
      // For local storage fallback
      const pairingData = {
        deviceId: this.deviceId,
        pairingCode: this.pairingCode,
        hostname: require('os').hostname(),
        platform: process.platform,
        status: 'waiting',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      };

      // Save to local pairing file for dashboard to read
      const pairingPath = path.join(__dirname, '../data/devicePairing.json');
      const pairingDir = path.dirname(pairingPath);
      
      if (!fs.existsSync(pairingDir)) {
        fs.mkdirSync(pairingDir, { recursive: true });
      }

      fs.writeFileSync(pairingPath, JSON.stringify(pairingData, null, 2));

      // Also save to dashboard public folder for direct access
      const dashboardPairingPath = path.join(__dirname, '../dashboard/public/data/devicePairing.json');
      const dashboardPairingDir = path.dirname(dashboardPairingPath);
      
      if (!fs.existsSync(dashboardPairingDir)) {
        fs.mkdirSync(dashboardPairingDir, { recursive: true });
      }

      fs.writeFileSync(dashboardPairingPath, JSON.stringify(pairingData, null, 2));

    } catch (error) {
      console.error('Failed to register for pairing:', error.message);
    }
  }

  /**
   * Check if device has been paired
   */
  checkPairingStatus() {
    try {
      const pairingPath = path.join(__dirname, '../data/devicePairing.json');
      
      if (fs.existsSync(pairingPath)) {
        const pairingData = JSON.parse(fs.readFileSync(pairingPath, 'utf8'));
        
        if (pairingData.status === 'connected' && pairingData.deviceId === this.deviceId) {
          this.isRegistered = true;
          this.saveDeviceConfig();
          
          console.log(chalk.green('🎉 Device successfully paired!'));
          console.log(chalk.green(`   Connected to: ${pairingData.userEmail}`));
          
          // Clean up pairing file
          fs.unlinkSync(pairingPath);
          
          return true;
        }
      }
    } catch (error) {
      // Silently handle errors
    }
    
    return false;
  }

  /**
   * Get device info for status reporting
   */
  getDeviceInfo() {
    return {
      deviceId: this.deviceId,
      isRegistered: this.isRegistered,
      pairingCode: this.pairingCode,
      hostname: require('os').hostname(),
      platform: process.platform
    };
  }

  /**
   * Reset device registration (for testing)
   */
  resetRegistration() {
    this.isRegistered = false;
    this.pairingCode = null;
    this.deviceId = null;
    
    try {
      if (fs.existsSync(this.configPath)) {
        fs.unlinkSync(this.configPath);
      }
    } catch (error) {
      console.warn('Failed to reset device config:', error.message);
    }
    
    console.log(chalk.yellow('🔄 Device registration reset'));
  }
}

module.exports = new DevicePairing();