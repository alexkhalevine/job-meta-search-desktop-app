import * as fs from 'fs'
import { Blacklist } from '../../src/main/services/blacklistService'
import { getBlacklistPath } from '../../src/main/services/helpers/getBlacklistPath'
import { ensureFileExists } from '../../src/main/services/helpers/ensureFileExists'

jest.mock('fs')
jest.mock('../../src/main/services/helpers/getBlacklistPath')
jest.mock('../../src/main/services/helpers/ensureFileExists')

const mockedFs = fs as jest.Mocked<typeof fs>
const mockedGetBlacklistPath = getBlacklistPath as jest.MockedFunction<typeof getBlacklistPath>
const mockedEnsureFileExists = ensureFileExists as jest.MockedFunction<typeof ensureFileExists>

describe('Blacklist Service', () => {
  const mockFilePath = '/mock/path/blacklist.json'

  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetBlacklistPath.mockReturnValue(mockFilePath)
    mockedEnsureFileExists.mockImplementation(() => {})
  })

  describe('load()', () => {
    it('should load and parse blacklist from file', async () => {
      const mockBlacklist = ['spam', 'scam', 'fraud']
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockBlacklist))

      const result = Blacklist.load()

      expect(result).toEqual(mockBlacklist)
      expect(mockedGetBlacklistPath).toHaveBeenCalled()
      expect(mockedEnsureFileExists).toHaveBeenCalledWith(mockFilePath)
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(mockFilePath, 'utf8')
    })

    it('should return empty array when file read fails', () => {
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found')
      })

      const result = Blacklist.load()

      expect(result).toEqual([])
    })

    it('should return empty array when JSON parse fails', () => {
      mockedFs.readFileSync.mockReturnValue('invalid json')

      const result = Blacklist.load()

      expect(result).toEqual([])
    })
  })

  describe('save()', () => {
    it('should normalize and save blacklist to file', () => {
      const input = ['  SPAM  ', 'scam', '  ', 'FRAUD', 'spam']
      const expected = ['spam', 'scam', 'fraud']

      const result = Blacklist.save(input)

      expect(result.success).toBe(true)
      expect(result.message).toContain('3 words')
      expect(mockedGetBlacklistPath).toHaveBeenCalled()
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockFilePath,
        JSON.stringify(expected, null, 2),
        'utf8'
      )
    })

    it('should remove empty strings and duplicates', () => {
      const input = ['spam', '', '  ', 'spam', 'SPAM', 'scam']

      Blacklist.save(input)

      const savedData = JSON.parse((mockedFs.writeFileSync as jest.Mock).mock.calls[0][1])
      expect(savedData).toEqual(['spam', 'scam'])
    })

    it('should trim and lowercase all words', () => {
      const input = ['  UPPERCASE  ', '  MixedCase  ', '  lowercase  ']

      Blacklist.save(input)

      const savedData = JSON.parse((mockedFs.writeFileSync as jest.Mock).mock.calls[0][1])
      expect(savedData).toEqual(['uppercase', 'mixedcase', 'lowercase'])
    })

    it('should handle empty array', () => {
      const result = Blacklist.save([])

      expect(result.success).toBe(true)
      expect(result.message).toContain('0 words')
    })

    it('should return error when file write fails', () => {
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const result = Blacklist.save(['spam'])

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to save blacklist')
      expect(result.error).toBe('Permission denied')
    })

    it('should handle unknown errors', () => {
      mockedFs.writeFileSync.mockImplementation(() => {
        throw 'string error'
      })

      const result = Blacklist.save(['spam'])

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unknown error')
    })
  })
})
