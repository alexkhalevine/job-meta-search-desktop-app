import { isRelevantJob } from '../../src/utils/filters'
import { Blacklist } from '../../src/utils/bannedKeywords'

// Mock the Blacklist module
jest.mock('../../src/utils/bannedKeywords')
jest.mock('dotenv')

const mockedBlacklist = Blacklist as jest.Mocked<typeof Blacklist>

describe('filters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set environment variable for testing
    process.env.LOCATION = 'vienna'
  })

  afterEach(() => {
    delete process.env.LOCATION
  })

  describe('isRelevantJob', () => {
    it('should return true for relevant job with matching location', () => {
      mockedBlacklist.load.mockReturnValue([])

      const job = {
        title: 'Software Developer',
        url: 'https://example.com/job1',
        location: 'Vienna, Austria',
        remote: false,
        description: 'Great opportunity for a developer'
      }

      const result = isRelevantJob(job)

      expect(result).toBe(true)
    })

    it('should return true for remote job when location does not match', () => {
      mockedBlacklist.load.mockReturnValue([])

      const job = {
        title: 'Software Developer',
        url: 'https://example.com/job2',
        location: 'Berlin, Germany',
        remote: true,
        description: 'Remote work opportunity'
      }

      const result = isRelevantJob(job)

      expect(result).toBe(true)
    })

    it('should return false for non-remote job with non-matching location', () => {
      mockedBlacklist.load.mockReturnValue([])

      const job = {
        title: 'Software Developer',
        url: 'https://example.com/job3',
        location: 'Munich, Germany',
        remote: false,
        description: 'On-site position'
      }

      const result = isRelevantJob(job)

      expect(result).toBe(false)
    })

    it('should return false when job title contains banned keyword', () => {
      mockedBlacklist.load.mockReturnValue(['spam', 'scam'])

      const job = {
        title: 'SPAM Developer Position',
        url: 'https://example.com/job4',
        location: 'Vienna, Austria',
        remote: false,
        description: 'Legitimate job posting'
      }

      const result = isRelevantJob(job)

      expect(result).toBe(false)
    })

    it('should return false when job URL contains banned keyword', () => {
      mockedBlacklist.load.mockReturnValue(['suspicious'])

      const job = {
        title: 'Software Developer',
        url: 'https://suspicious-company.com/job5',
        location: 'Vienna, Austria',
        remote: false,
        description: 'Job opportunity'
      }

      const result = isRelevantJob(job)

      expect(result).toBe(false)
    })

    it('should return false when job description contains banned keyword', () => {
      mockedBlacklist.load.mockReturnValue(['mlm', 'pyramid'])

      const job = {
        title: 'Sales Representative',
        url: 'https://example.com/job6',
        location: 'Vienna, Austria',
        remote: false,
        description: 'Join our MLM network and earn big money'
      }

      const result = isRelevantJob(job)

      expect(result).toBe(false)
    })

    it('should handle missing description', () => {
      mockedBlacklist.load.mockReturnValue(['test'])

      const job = {
        title: 'Software Developer',
        url: 'https://example.com/job7',
        location: 'Vienna, Austria',
        remote: false
      }

      const result = isRelevantJob(job)

      expect(result).toBe(true)
    })

    it('should be case insensitive for all checks', () => {
      mockedBlacklist.load.mockReturnValue(['SPAM'])

      const job = {
        title: 'spam developer',
        url: 'https://example.com/job8',
        location: 'VIENNA',
        remote: false,
        description: 'job description'
      }

      const result = isRelevantJob(job)

      expect(result).toBe(false)
    })
  })
})
