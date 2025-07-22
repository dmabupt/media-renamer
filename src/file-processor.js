const path = require('path');
const { exiftool } = require('exiftool-vendored');

// Supported media file extensions
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.heic', '.webp']);
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp', '.mts', '.mpg']);

// Filename pattern regex
const NAME_PATTERN = /^(IMG|VID)_\d{8}_\d{6}/i;

class FileProcessor {
  constructor(inputDir, outputDir, dryRun) {
    this.inputDir = inputDir;
    this.outputDir = outputDir;
    this.dryRun = dryRun;
    
    this.picOutputDir = path.join(outputDir, 'Pictures');
    this.vidOutputDir = path.join(outputDir, 'Video');
    
    // 计算最近3天的日期边界（UTC时间）
    this.recentThreshold = new Date();
    this.recentThreshold.setDate(this.recentThreshold.getDate() - 3);
  }

  async processFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const isImage = IMAGE_EXTS.has(ext);
    const isVideo = VIDEO_EXTS.has(ext);
    
    if (!isImage && !isVideo) {
      return { action: 'skipped', filePath };
    }

    const fileName = path.basename(filePath);
    const prefix = isImage ? 'IMG' : 'VID';
    const targetDir = isImage ? this.picOutputDir : this.vidOutputDir;

    // Check if filename already matches pattern
    if (NAME_PATTERN.test(fileName)) {
      return { 
        action: 'copied', 
        filePath,
        destPath: path.join(targetDir, fileName),
        reason: 'filename already matches pattern'
      };
    }

    try {
      // Read metadata
      const tags = await exiftool.read(filePath);
      const createDate = tags.CreateDate || tags.DateTimeOriginal || tags.ModifyDate || tags.FileModifyDate;
      
      if (!createDate) {
        return { 
          action: 'copied', 
          filePath,
          destPath: path.join(targetDir, fileName),
          reason: 'no creation date found'
        };
      }

      // Format filename
      const date = new Date(createDate);
      if (isNaN(date)) throw new Error('Invalid date format');
      
      // 检查创建日期是否在最近3天内
      if (date > this.recentThreshold) {
        return { 
          action: 'copied', 
          filePath,
          destPath: path.join(targetDir, fileName),
          reason: 'recent file (within 3 days)',
          originalDate: date.toISOString()
        };
      }
      
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      
      const newFileName = `${prefix}_${year}${month}${day}_${hours}${minutes}${seconds}${ext}`;
      
      return {
        action: 'renamed',
        filePath,
        destPath: path.join(targetDir, newFileName),
        newFileName,
        originalDate: date.toISOString()
      };
      
    } catch (error) {
      return {
        action: 'error',
        filePath,
        error: error.message,
        destPath: path.join(targetDir, fileName)
      };
    }
  }
}

module.exports = FileProcessor;