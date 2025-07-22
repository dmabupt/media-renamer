#!/usr/bin/env node
const minimist = require('minimist');
const path = require('path');
const fs = require('fs');
const ProgressLogger = require('./progress-logger');
const ThreadManager = require('./thread-manager');

async function main() {
  // Parse command line arguments
  const argv = minimist(process.argv.slice(2));
  const inputDir = argv._[0];
  const outputDir = argv._[1];
  const dryRun = argv['dry-run'] || false;

  // Validate arguments
  if (!inputDir || !outputDir) {
    console.error('Usage: media-renamer <input_dir> <output_dir> [--dry-run]');
    console.error('Example: media-renamer "C:\\My Photos" "D:\\Organized Media" --dry-run');
    process.exit(1);
  }

  try {
    // Setup console for Chinese paths on Windows
    if (process.platform === 'win32') {
      try {
        const { execSync } = require('child_process');
        execSync('chcp 65001');
      } catch (chcpError) {
        console.warn('Warning: Failed to set console encoding to UTF-8');
      }
    }

    console.log('='.repeat(70));
    console.log('Enhanced Media File Renamer and Organizer');
    console.log('='.repeat(70));
    console.log(`Input directory: ${inputDir}`);
    console.log(`Output directory: ${outputDir}`);
    console.log(`Dry run mode: ${dryRun ? 'ON (no files will be modified)' : 'OFF'}`);
    
    // Get all files recursively
    const allFiles = await getFilesRecursively(inputDir);
    console.log(`Found ${allFiles.length} files to process`);
    console.log(`Using ${Math.max(1, require('os').cpus().length - 1)} worker threads`);
    console.log('-'.repeat(70));

    if (allFiles.length === 0) {
      console.log('No files found for processing');
      process.exit(0);
    }

    // Initialize progress logger
    const progressLogger = new ProgressLogger(allFiles.length);
    
    // Create thread manager
    const threadManager = new ThreadManager(
      path.resolve(inputDir),
      path.resolve(outputDir),
      dryRun,
      progressLogger
    );
    
    // Process files using worker threads
    const stats = await threadManager.processFiles(allFiles);
    
    // Finalize progress reporting
    progressLogger.finalize();
    
    // Print summary statistics
    console.log('\nProcessing Statistics:');
    console.log('='.repeat(50));
    console.log(`Renamed files: ${stats.renamed}`);
    console.log(`Copied files: ${stats.copied.total}`);
    console.log(`  - Already matched pattern: ${stats.copied.patternMatch}`);
    console.log(`  - No creation date found: ${stats.copied.noDate}`);
    console.log(`  - Recent files (<3 days): ${stats.copied.recentFile}`);
    console.log(`Skipped files: ${stats.skipped}`);
    console.log(`Files with errors: ${stats.errors}`);
    console.log('='.repeat(50));
    
    // 显示最近文件警告（如果有）
    if (stats.copied.recentFile > 0) {
      console.log('\n⚠️  Recent files detected (not renamed):');
      stats.recentFiles.slice(0, 5).forEach(file => {
        console.log(`  - ${path.basename(file.file)} (${file.date})`);
      });
      if (stats.copied.recentFile > 5) {
        console.log(`  ... and ${stats.copied.recentFile - 5} more`);
      }
      console.log('These files were copied without renaming because their');
      console.log('creation date is within the last 3 days and may be inaccurate.');
    }
    
  } catch (error) {
    console.error(`\nFatal error: ${error.message}`);
    process.exit(1);
  }
}

// Recursive function to get all files in directory
async function getFilesRecursively(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true, encoding: 'utf-8' });
  const files = await Promise.all(entries.map(async entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return getFilesRecursively(fullPath);
    } else {
      return fullPath;
    }
  }));
  return files.flat();
}

main();