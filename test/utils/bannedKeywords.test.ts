import * as fs from 'fs'
import { Blacklist } from '../../src/utils/bannedKeywords'

// Mock fs module
jest.mock('fs')
const mockedFs = fs as jest.Mocked<typeof fs>

xdescribe('Blacklist', () => {
  let consoleErrorSpy: jest.SpyInstance
  let consoleLogSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  describe('load', () => {
    it('should return empty array when file does not exist and creation fails', () => {
      mockedFs.existsSync.mockReturnValue(false)
      mockedFs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const result = Blacklist.load()

      expect(result).toEqual([])
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Blacklist file not found, creating default file'
      )
    })

    it('should return parsed JSON when file exists', () => {
      const mockData = ['spam', 'scam', 'mlm']
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockData))

      const result = Blacklist.load()

      expect(result).toEqual(mockData)
    })

    it('should return empty array when JSON parsing fails', () => {
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readFileSync.mockReturnValue('invalid json')

      const result = Blacklist.load()

      expect(result).toEqual([])
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should create default file when it does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false)
      mockedFs.mkdirSync.mockReturnValue(undefined)
      mockedFs.writeFileSync.mockReturnValue(undefined)

      const result = Blacklist.load()

      expect(result).toEqual([])
      expect(mockedFs.mkdirSync).toHaveBeenCalled()
      expect(mockedFs.writeFileSync).toHaveBeenCalled()
    })
  })

  describe('save', () => {
    it('should save cleaned blacklist array successfully', () => {
      const input = ['  SPAM  ', 'scam', '', 'MLM', 'spam']
      const expected = ['spam', 'scam', 'mlm']

      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.writeFileSync.mockReturnValue(undefined)

      const result = Blacklist.save(input)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Successfully saved blacklist with 3 words')
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(expected, null, 2),
        'utf8'
      )
    })

    it('should handle write errors gracefully', () => {
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('Disk full')
      })

      const result = Blacklist.save(['test'])

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to save blacklist')
      expect(result.error).toBe('Disk full')
    })

    it('should remove duplicates and empty strings', () => {
      const input = ['spam', '', 'spam', '  ', 'scam', 'SPAM']

      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.writeFileSync.mockReturnValue(undefined)

      const result = Blacklist.save(input)

      expect(result.success).toBe(true)
      // Should save 2 unique words: 'spam' and 'scam'
      expect(result.message).toContain('Successfully saved blacklist with 2 words')
    })
  })
})
