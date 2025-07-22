const path = require('path');

class ProgressLogger {
  constructor(totalFiles) {
    this.totalFiles = totalFiles;
    this.processedFiles = 0;
    this.copiedFiles = 0;
    this.renamedFiles = 0;
    this.skippedFiles = 0;
    this.errorFiles = 0;
    this.startTime = Date.now();
    this.lastUpdate = 0;
  }

  update(action, filePath) {
    this.processedFiles++;
    
    switch(action) {
      case 'copied':
        this.copiedFiles++;
        break;
      case 'renamed':
        this.renamedFiles++;
        break;
      case 'skipped':
        this.skippedFiles++;
        break;
      case 'error':
        this.errorFiles++;
        break;
    }
    
    // 限制更新频率，避免刷新太快
    const now = Date.now();
    if (now - this.lastUpdate > 100 || this.processedFiles === this.totalFiles) {
      this.printProgress(filePath);
      this.lastUpdate = now;
    }
  }

  printProgress(filePath) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const progress = Math.min(100, (this.processedFiles / this.totalFiles * 100)).toFixed(1);
    
    // 截取文件名显示
    const fileName = path.basename(filePath);
    const displayName = fileName.length > 20 
      ? fileName.substring(0, 17) + '...' 
      : fileName.padEnd(20, ' ');
    
    // 更新进度行
    process.stdout.write(
      `\r[${this.processedFiles.toString().padStart(4)}/${this.totalFiles}] ` +
      `Progress: ${progress}% | ` +
      `Elapsed: ${elapsed}s | ` +
      `File: ${displayName} ` +
      ' '.repeat(20) // 清除行尾残留字符
    );
  }

  finalize() {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    console.log('\n\nProcessing complete!');
    console.log('='.repeat(50));
    console.log(`Total files processed: ${this.totalFiles}`);
    console.log(`  - Renamed and copied: ${this.renamedFiles}`);
    console.log(`  - Copied without rename: ${this.copiedFiles}`);
    console.log(`  - Skipped: ${this.skippedFiles}`);
    console.log(`  - Errors: ${this.errorFiles}`);
    console.log(`Total time: ${elapsed} seconds`);
    console.log('='.repeat(50));
  }
}

module.exports = ProgressLogger;