import { JobScraperService, SearchConfig } from '../../src/main/services/jobScraperService'
import { SettingsLoader } from '../../src/utils/settingsLoader'
import { store } from '../../src/main/services/scappers/store'
import type { IpcMainInvokeEvent } from 'electron'
import karriereCrawler from '../../src/main/services/scappers/karriereScrapper'
import stepstoneCrawler from '../../src/main/services/scappers/stepStoneScrapper'
import willhabbenCrawler from '../../src/main/services/scappers/willhabbenScrapper'
import serpCrawler from '../../src/main/services/scappers/serpScrapper'
import jobsAtCrawler from '../../src/main/services/scappers/jobsAtScrapper'
import derStandardCrawler from '../../src/main/services/scappers/derStandardScrapper'
import wienJobsCrawler from '../../src/main/services/scappers/wienJobsCrawler'

jest.mock('../../src/utils/settingsLoader')
jest.mock('../../src/main/services/scappers/store')
jest.mock('../../src/main/services/scappers/karriereScrapper', () => ({
  __esModule: true,
  default: { extract: jest.fn(), normalize: jest.fn(), name: 'karriere.at' }
}))
jest.mock('../../src/main/services/scappers/stepStoneScrapper', () => ({
  __esModule: true,
  default: { extract: jest.fn(), normalize: jest.fn(), name: 'stepstone.at' }
}))
jest.mock('../../src/main/services/scappers/willhabbenScrapper', () => ({
  __esModule: true,
  default: { extract: jest.fn(), normalize: jest.fn(), name: 'willhaben.at' }
}))
jest.mock('../../src/main/services/scappers/serpScrapper', () => ({
  __esModule: true,
  default: { extract: jest.fn(), normalize: jest.fn(), name: 'google_jobs_via_serpapi' }
}))
jest.mock('../../src/main/services/scappers/jobsAtScrapper', () => ({
  __esModule: true,
  default: { extract: jest.fn(), normalize: jest.fn(), name: 'jobs.at' }
}))
jest.mock('../../src/main/services/scappers/derStandardScrapper', () => ({
  __esModule: true,
  default: { extract: jest.fn(), normalize: jest.fn(), name: 'jobs.derstandard.at' }
}))
jest.mock('../../src/main/services/scappers/wienJobsCrawler', () => ({
  __esModule: true,
  default: { extract: jest.fn(), normalize: jest.fn(), name: 'jobs.wien.gv.at' }
}))

const mockedSettingsLoader = SettingsLoader as jest.Mocked<typeof SettingsLoader>
const mockedStore = store as jest.Mocked<typeof store>

describe('JobScraperService', () => {
  let service: JobScraperService
  let mockEvent: Partial<IpcMainInvokeEvent>
  let mockConfig: SearchConfig

  beforeEach(() => {
    jest.clearAllMocks()
    service = new JobScraperService()

    mockEvent = {
      sender: {
        send: jest.fn()
      } as any
    }

    mockConfig = {
      searchQuery: 'software developer',
      location: 'Vienna'
    }

    // Default settings
    mockedSettingsLoader.load.mockReturnValue({
      secrets: {
        SERPAPI_KEY: 'test-key'
      },
      enableAdvancedCrawling: false
    })

    // Mock store
    mockedStore.upsertMany.mockImplementation(() => {})

    // Reset all crawler mocks to default
    ;(karriereCrawler.extract as jest.Mock).mockResolvedValue([])
    ;(stepstoneCrawler.extract as jest.Mock).mockResolvedValue([])
    ;(willhabbenCrawler.extract as jest.Mock).mockResolvedValue([])
    ;(serpCrawler.extract as jest.Mock).mockResolvedValue([])
    ;(jobsAtCrawler.extract as jest.Mock).mockResolvedValue([])
    ;(derStandardCrawler.extract as jest.Mock).mockResolvedValue([])
    ;(wienJobsCrawler.extract as jest.Mock).mockResolvedValue([])
  })

  describe('searchJobs()', () => {
    it('should run all standard crawlers and return normalized jobs', async () => {
      const mockJobs = [
        {
          id: '1',
          title: 'Dev 1',
          company: 'Company A',
          location: 'Vienna',
          remote: false,
          description: 'Job 1',
          url: 'http://test1.com',
          source: 'karriere.at',
          scrapedAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Dev 2',
          company: 'Company B',
          location: 'Vienna',
          remote: true,
          description: 'Job 2',
          url: 'http://test2.com',
          source: 'stepstone.at',
          scrapedAt: new Date().toISOString()
        }
      ]

      ;(karriereCrawler.extract as jest.Mock).mockResolvedValue([{ raw: 'data1' }])
      ;(karriereCrawler.normalize as jest.Mock).mockReturnValue(mockJobs[0])
      ;(stepstoneCrawler.extract as jest.Mock).mockResolvedValue([{ raw: 'data2' }])
      ;(stepstoneCrawler.normalize as jest.Mock).mockReturnValue(mockJobs[1])

      const result = await service.searchJobs(mockConfig)

      expect(result).toHaveLength(2)
      expect(mockedStore.upsertMany).toHaveBeenCalledWith(expect.arrayContaining(mockJobs))
    })

    it('should include Wien crawler when advanced crawling is enabled', async () => {
      mockedSettingsLoader.load.mockReturnValue({
        secrets: {
          SERPAPI_KEY: 'test-key'
        },
        enableAdvancedCrawling: true
      })

      const mockWienJob = {
        id: '3',
        title: 'Wien Job',
        company: 'Municipality',
        location: 'Vienna',
        remote: false,
        description: 'Municipal job',
        url: 'http://wien.at/job',
        source: 'jobs.wien.gv.at',
        scrapedAt: new Date().toISOString()
      }

      ;(wienJobsCrawler.extract as jest.Mock).mockResolvedValue([{ raw: 'wien-data' }])
      ;(wienJobsCrawler.normalize as jest.Mock).mockReturnValue(mockWienJob)

      const result = await service.searchJobs(mockConfig, mockEvent as IpcMainInvokeEvent)

      expect(wienJobsCrawler.extract).toHaveBeenCalledWith(mockConfig)
      expect(result).toContain(mockWienJob)
    })

    it('should not include Wien crawler when advanced crawling is disabled', async () => {
      mockedSettingsLoader.load.mockReturnValue({
        secrets: {
          SERPAPI_KEY: 'test-key'
        },
        enableAdvancedCrawling: false
      })

      await service.searchJobs(mockConfig)

      expect(wienJobsCrawler.extract).not.toHaveBeenCalled()
    })

    it('should handle crawler failures gracefully', async () => {
      ;(karriereCrawler.extract as jest.Mock).mockRejectedValue(new Error('Network error'))
      ;(stepstoneCrawler.extract as jest.Mock).mockResolvedValue([])

      const result = await service.searchJobs(mockConfig, mockEvent as IpcMainInvokeEvent)

      expect(result).toEqual([])
      expect(mockEvent.sender?.send).toHaveBeenCalledWith(
        'crawler-progress',
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('failed')
        })
      )
    })

    it('should emit progress messages when event is provided', async () => {
      await service.searchJobs(mockConfig, mockEvent as IpcMainInvokeEvent)

      expect(mockEvent.sender?.send).toHaveBeenCalledWith(
        'crawler-progress',
        expect.objectContaining({
          message: expect.stringContaining('Starting job search'),
          type: 'info'
        })
      )
    })

    it('should filter out null normalized results', async () => {
      ;(karriereCrawler.extract as jest.Mock).mockResolvedValue([
        { raw: 'data1' },
        { raw: 'invalid' }
      ])
      ;(karriereCrawler.normalize as jest.Mock)
        .mockReturnValueOnce({
          id: '1',
          title: 'Valid Job',
          company: 'Test',
          location: 'Vienna',
          remote: false,
          description: 'Test',
          url: 'http://test.com',
          source: 'test',
          scrapedAt: new Date().toISOString()
        })
        .mockReturnValueOnce(null)

      const result = await service.searchJobs(mockConfig)

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Valid Job')
    })

    it('should not emit progress when event is undefined', async () => {
      await service.searchJobs(mockConfig)

      expect(mockEvent.sender?.send).not.toHaveBeenCalled()
    })
  })

  describe('runCrawler()', () => {
    it('should extract and normalize crawler results', async () => {
      const mockJob = {
        id: '1',
        title: 'Test Job',
        company: 'Test Co',
        location: 'Vienna',
        remote: false,
        description: 'Test',
        url: 'http://test.com',
        source: 'karriere.at',
        scrapedAt: new Date().toISOString()
      }

      ;(karriereCrawler.extract as jest.Mock).mockResolvedValue([{ raw: 'data' }])
      ;(karriereCrawler.normalize as jest.Mock).mockReturnValue(mockJob)

      const result = await (service as any).runCrawler(
        karriereCrawler,
        mockConfig,
        mockEvent as IpcMainInvokeEvent
      )

      expect(karriereCrawler.extract).toHaveBeenCalledWith(mockConfig)
      expect(karriereCrawler.normalize).toHaveBeenCalledWith({ raw: 'data' })
      expect(result).toEqual([mockJob])
    })

    it('should throw error when crawler fails', async () => {
      ;(karriereCrawler.extract as jest.Mock).mockRejectedValue(new Error('Crawler failed'))

      await expect((service as any).runCrawler(karriereCrawler, mockConfig)).rejects.toThrow(
        'Crawler failed'
      )
    })
  })

  describe('emitProgress()', () => {
    it('should emit progress message when event is provided', () => {
      ;(service as any).emitProgress(
        mockEvent as IpcMainInvokeEvent,
        'Test message',
        'info',
        'test-source'
      )

      expect(mockEvent.sender?.send).toHaveBeenCalledWith(
        'crawler-progress',
        expect.objectContaining({
          message: 'Test message',
          type: 'info',
          source: 'test-source',
          id: expect.any(String),
          timestamp: expect.any(Number)
        })
      )
    })

    it('should not emit when event is undefined', () => {
      ;(service as any).emitProgress(undefined, 'Test message', 'info')

      expect(mockEvent.sender?.send).not.toHaveBeenCalled()
    })

    it('should use default type "info" when not specified', () => {
      ;(service as any).emitProgress(mockEvent as IpcMainInvokeEvent, 'Test message')

      expect(mockEvent.sender?.send).toHaveBeenCalledWith(
        'crawler-progress',
        expect.objectContaining({
          type: 'info'
        })
      )
    })
  })
})
