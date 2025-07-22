const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const FileProcessor = require('./file-processor');

const copyFile = promisify(fs.copyFile);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);

async function processBatch() {
  const { files, inputDir, outputDir, dryRun } = workerData;
  const processor = new FileProcessor(inputDir, outputDir, dryRun);
  const results = [];
  
  for (const filePath of files) {
    try {
      const result = await processor.processFile(filePath);
      
      if (dryRun) {
        results.push(result);
        continue;
      }
      
      if (result.destPath) {
        // Resolve conflicts and copy file
        let finalDestPath = result.destPath;
        let counter = 1;
        const parsedPath = path.parse(result.destPath);
        
        while (true) {
          try {
            // Check if file exists
            await stat(finalDestPath);
            
            // File exists, compare size
            const srcStats = await stat(filePath);
            const destStats = await stat(finalDestPath);
            
            // Same size - overwrite
            if (srcStats.size === destStats.size) {
              break;
            }
            
            // Different size - add suffix
            const newName = `${parsedPath.name}_${counter}${parsedPath.ext}`;
            finalDestPath = path.join(parsedPath.dir, newName);
            counter++;
          } catch (err) {
            // File doesn't exist
            break;
          }
        }
        
        // Ensure directory exists
        await mkdir(path.dirname(finalDestPath), { recursive: true });
        await copyFile(filePath, finalDestPath);
        
        results.push({ ...result, finalDestPath });
      } else {
        results.push(result);
      }
    } catch (error) {
      results.push({
        action: 'error',
        filePath,
        error: error.message
      });
    }
    
    // Send progress update
    parentPort.postMessage({ 
      type: 'progress', 
      filePath 
    });
  }
  
  return results;
}

processBatch()
  .then(results => {
    parentPort.postMessage({ 
      type: 'complete', 
      results 
    });
  })
  .catch(error => {
    parentPort.postMessage({ 
      type: 'error', 
      error: error.message 
    });
  });