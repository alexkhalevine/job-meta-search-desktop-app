# Job Search by `devprod`

### Look for jobs using intelligent meta-search assistant.

This tool does not store any public data from third-party job search engines or services. It is a non-profit personal productivity tool, meant to simplify the job search process by adding useful features such as a “blacklist” and combining results into a single list.

Currently, the tool is optimized for use in Austria. Support for additional regions will follow.

## 🚀 Features

### **Meta-Search Across Multiple Platforms**
This application aggregates job listings from major Austrian job platforms, providing a comprehensive search experience:

#### **Supported Job Platforms:**
- **🏢 karriere.at** - Austria's leading job portal
- **💼 stepstone.at** - Professional career opportunities
- **🏠 willhaben.at** - Austria's largest classifieds including jobs
- **📋 jobs.at** - Comprehensive job listings
- **🌐 jobs.derstandard.at** - Der Standard newspaper job portal
- **🔍 Google Jobs** - Global job search (via SerpAPI)
- **🏛️ jobs.wien.gv.at** - Vienna municipal government positions (Advanced feature)

### **Smart Job Management Features**

#### **🔍 Intelligent Search**
- **Multi-platform querying** with a single search
- **Location-based filtering** for targeted results
- **Real-time lookup** with ETL (Extract-Transform-Load) pipeline
- **Duplicate detection** across different platforms

#### **📊 Advanced Filtering & Organization**
- **Blacklist functionality** to exclude unwanted companies or keywords
- **Remote work detection** automatically identifies work-from-home opportunities
- **Salary information extraction** when available
- **Job posting freshness** with timestamps and posting dates

#### **⚙️ Customizable Experience**
- **Advanced search toggle** for additional sources (Wien municipal jobs)
- **API key configuration** for premium features (SerpAPI/Google Jobs)
- **Cross-platform compatibility** (Windows, macOS, Linux)
- **Offline functionality** for cached results

#### **🛡️ Privacy & Ethics**
- **No data storage** of third-party job listings
- **Non-profit personal tool** designed for productivity
- **Local processing** - all data stays on your device

### **Technical Advantages**

#### **🏗️ Modern Architecture**
- **ETL Pipeline** for consistent data processing
- **TypeScript** for type safety and reliability
- **Electron-based desktop app** for native performance
- **React frontend** with modern UI components
- **Automated testing** with Jest framework

#### **🔄 Robust Data Processing**
- **Error handling** with graceful failures per platform
- **Platform-specific parsing** optimized for each job site
- **Concurrent processing** for faster results
- **Automatic retry logic** for network issues

### **Perfect for Job Seekers Who:**
- ✅ Want to search multiple platforms simultaneously
- ✅ Need to filter out specific companies or keywords
- ✅ Prefer desktop applications over web interfaces
- ✅ Value privacy and local data processing
- ✅ Search for jobs in Austria (Wien, Salzburg, Linz, Graz, etc.)
- ✅ Want to identify remote work opportunities quickly
- ✅ Need to track job posting dates and freshness

## Development Setup

1. Run `npm i`
2. Run `npm run dev`
3. Optional: create `.env` file with `SERPAPI_KEY=your_key`.

`SERPAPI_KEY` env var, is optional, if you want to include job hits from indeed.com / google jobs.
You can create this API key on https://serpapi.com.

## Building

(compiled files will be in `dist` folder)

- How to compile for mac silicon `npm run build:mac`
- How to compile for mac intel `npm run build:mac-intel`
- How to compile for linux `npm run build:linux`
- How to compile for windows `npm run build:win"`

Preview of UI:

<img width="1473" height="889" alt="Screenshot 2025-09-21 at 20 53 09" src="https://github.com/user-attachments/assets/8e0d8a62-ec3e-459d-865a-b541449c706d" />

Settings section with option to add premium API keys:

<img width="1912" height="1073" alt="Screenshot 2025-07-31 at 12 05 36" src="https://github.com/user-attachments/assets/1b5d71ef-5e11-49cc-8905-3bd1a4d29238" />

## Testing

This project uses Jest test framework for testing the Node.js backend code (main and utils folders).

### Available Test Commands

- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode (re-runs on file changes)
- `npm run test:coverage` - Run tests with coverage report

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npx jest test/utils/filters.test.ts
```
