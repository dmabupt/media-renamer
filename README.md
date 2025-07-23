# Media File Renamer
A command-line tool to rename and organize media files based on their creation date from EXIF data. Automatically categorizes photos and videos into separate directories.

![npm version](https://img.shields.io/npm/v/media-renamer)
![npm license](https://img.shields.io/npm/l/media-renamer)
## Features
- 📸 Automatic detection of photo and video files
- ✨ Intelligent renaming based on creation date
- 📁 Automatic categorization into Pictures/Video directories
- ⚙️ Supports Chinese paths and Windows systems
- 🔍 Conflict detection and resolution
- 📊 Single-line real-time progress display
- 🐳 Docker container support
- 🚦 `--dry-run` preview mode
- 📝 Detailed statistics report after processing
## Installation and Usage
### Prerequisites
- Node.js (v14 or higher) or Docker
### Method 1: As a Node.js application
#### Global installation
```bash
npm install -g media-renamer
```
#### Local use (without installation)
```bash
npx media-renamer <input_dir> <output_dir> [--dry-run]
```
### Method 2: As a Docker container
#### Build Docker image
```bash
docker build -t media-renamer .
```
#### Run container
```bash
docker run -it --rm \
  -v /path/to/input:/input \
  -v /path/to/output:/output \
  media-renamer /input /output [--dry-run]
```
#### Using docker-compose
1. Create directory structure:
   ```
   project/
   ├── input/    # Place unorganized media files here
   ├── output/   # Target output directory
   └── docker-compose.yml
   ```
2. Run:
   ```bash
   docker-compose run --rm media-renamer
   ```
## Usage
### Basic command
```
media-renamer <input_dir> <output_dir> [--dry-run]
```
- `<input_dir>`: Directory containing media files (supports subdirectories)
- `<output_dir>`: Target directory for organized files
- `--dry-run`: Preview operations without modifying files
### Examples
```bash
# Node.js basic usage
media-renamer "C:\\Users\\MyUser\\Pictures\\Unorganized" "D:\\Media\\Organized"
# Node.js dry-run mode
media-renamer "~/photos/unorganized" "~/media/organized" --dry-run
# Docker basic usage
docker run -it --rm \
  -v C:\\Users\\MyUser\\Pictures\\Unorganized:/input \
  -v D:\\Media\\Organized:/output \
  media-renamer /input /output
# Docker dry-run mode
docker run -it --rm \
  -v /home/user/photos/unorganized:/input \
  -v /home/user/media/organized:/output \
  media-renamer /input /output --dry-run
```
## Supported File Formats
### Images
.jpg, .jpeg, .png, .gif, .bmp, .tiff, .heic, .webp
### Videos
.mp4, .mov, .avi, .mkv, .flv, .wmv, .m4v, .3gp, .mts, .mpg
## Renaming Rules
- Image files: `IMG_YYYYMMDD_hhmmss.ext` (e.g. `IMG_20230515_143045.jpg`)
- Video files: `VID_YYYYMMDD_hhmmss.ext` (e.g. `VID_20230515_143108.mp4`)
## How It Works
1. Recursively scans all media files in the input directory
2. For each file:
   - Skips non-media files
   - Copies without renaming if filename already matches pattern
   - Otherwise reads creation date from EXIF/metadata
   - Renames file based on creation date
3. Handles filename conflicts:
   - Overwrites if same file size
   - Appends sequence number if different size (e.g. `IMG_20240101_120000_1.jpg`)
4. Copies images to `<output_dir>/Pictures`
5. Copies videos to `<output_dir>/Video`
## Progress Display
Shows single-line progress during processing:
```
[  45/120] Progress: 37.5% | Elapsed: 12.3s | File: DSC_1234.JPG
```
- `[45/120]`: Processed files / Total files
- `Progress: 37.5%`: Completion percentage
- `Elapsed: 12.3s`: Time elapsed
- `File: DSC_1234.JPG`: Current file being processed
## Final Report
Displays detailed statistics after completion:
```
Processing complete!
==================================================
Total files processed: 120
  - Renamed and copied: 85
  - Copied without rename: 25
  - Skipped: 5
  - Errors: 5
Total time: 24.7 seconds
==================================================
```
## Docker Notes
1. Use `-v` flags to mount host directories:
   - Mount input directory to `/input`
   - Mount output directory to `/output`
2. Windows path example:
   ```powershell
   docker run -it --rm `
     -v "C:\Users\MyUser\Pictures\Unorganized:/input" `
     -v "D:\Media\Organized:/output" `
     media-renamer /input /output
   ```
3. Linux/macOS path example:
   ```bash
   docker run -it --rm \
     -v /home/user/photos/unorganized:/input \
     -v /home/user/media/organized:/output \
     media-renamer /input /output
   ```
4. For large numbers of files, increase shared memory:
   ```bash
   docker run -it --rm --shm-size=1g \
     -v /path/to/input:/input \
     -v /path/to/output:/output \
     media-renamer /input /output
   ```
## General Notes
1. Original files are never modified (only copied)
2. Files without creation date retain original names
3. Console encoding is automatically set for Chinese paths on Windows
4. Use `--dry-run` to safely preview operations
## License
MIT
