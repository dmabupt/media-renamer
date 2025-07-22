const { Worker } = require('worker_threads');
const os = require('os');
const path = require('path');

class ThreadManager {
  constructor(inputDir, outputDir, dryRun, logger) {
    this.inputDir = inputDir;
    this.outputDir = outputDir;
    this.dryRun = dryRun;
    this.logger = logger;
    this.workerResults = [];
    
    // 根据CPU核心数设置线程数
    this.threadCount = Math.max(1, os.cpus().length - 1);
  }

  async processFiles(fileList) {
    // 将文件列表均匀分配到各线程
    const filesPerThread = Math.ceil(fileList.length / this.threadCount);
    const batches = [];
    
    for (let i = 0; i < this.threadCount; i++) {
      const start = i * filesPerThread;
      const end = Math.min(start + filesPerThread, fileList.length);
      batches.push(fileList.slice(start, end));
    }
    
    // 过滤空批次
    const nonEmptyBatches = batches.filter(batch => batch.length > 0);
    
    // 创建并运行工作线程
    const workers = nonEmptyBatches.map((batch, index) => {
      return new Promise((resolve, reject) => {
        const worker = new Worker(path.join(__dirname, 'worker.js'), {
          workerData: {
            files: batch,
            inputDir: this.inputDir,
            outputDir: this.outputDir,
            dryRun: this.dryRun
          }
        });
        
        worker.on('message', (message) => {
          if (message.type === 'progress') {
            this.logger.update('processing', message.filePath);
          } else if (message.type === 'complete') {
            this.workerResults.push(...message.results);
            resolve();
          } else if (message.type === 'error') {
            reject(new Error(`Worker error: ${message.error}`));
          }
        });
        
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });
      });
    });
    
    await Promise.all(workers);
    return this.analyzeResults();
  }
  
  analyzeResults() {
    const stats = {
      renamed: 0,
      copied: {
        total: 0,
        patternMatch: 0,
        noDate: 0,
        recentFile: 0
      },
      skipped: 0,
      errors: 0,
      recentFiles: []
    };
    
    this.workerResults.forEach(result => {
      switch (result.action) {
        case 'renamed':
          stats.renamed++;
          break;
        case 'copied':
          stats.copied.total++;
          if (result.reason === 'filename already matches pattern') {
            stats.copied.patternMatch++;
          } else if (result.reason === 'no creation date found') {
            stats.copied.noDate++;
          } else if (result.reason === 'recent file (within 3 days)') {
            stats.copied.recentFile++;
            stats.recentFiles.push({
              file: result.filePath,
              date: result.originalDate
            });
          }
          break;
        case 'skipped':
          stats.skipped++;
          break;
        case 'error':
          stats.errors++;
          break;
      }
    });
    
    return stats;
  }
}

module.exports = ThreadManager;