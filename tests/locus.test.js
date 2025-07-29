// @jest-environment node
import request from 'supertest';
import app from '../index.js';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

const mockLocusData = [
  {
    id: 3106326,
    assemblyId: 'WEWSeq_v.1.0',
    locusName:
      'cfc38349266a6bc69956bedc917d0edb00069168bf77c8242d50729767e98670@4A/547925668-547987324:1',
    publicLocusName: '"432B32430F9FCBB8',
    chromosome: '4A',
    strand: '1',
    locusStart: 547925668,
    locusStop: 547925668,
    memberCount: 5,
  },
];

const mockLocusMembers = [
  {
    id: 465218,
    regionId: 31095388,
    locusId: 155095,
    membershipStatus: 'member',
  },
];

const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockResolvedValue(mockLocusData),
};

jest.mock('../db/index.js', () => ({
  db: mockDb,
}));

describe('GET /api/locus', () => {
  let adminToken;
  let limitedToken;

  beforeAll(() => {
    adminToken = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    limitedToken = jwt.sign(
      { id: 2, username: 'limited', role: 'limited' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.select.mockImplementation(() => ({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue(mockLocusData),
    }));
  });

  it('should return 401 if no token provided', async () => {
    const res = await request(app).get('/api/locus');
    expect(res.statusCode).toBe(401);
  });

  it('should return 403 if invalid token provided', async () => {
    const res = await request(app).get('/api/locus').set('Authorization', 'Bearer invalid-token');

    expect(res.statusCode).toBe(403);
  });

  it('should return locus data with valid admin token', async () => {
    const res = await request(app).get('/api/locus').set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({
      id: expect.any(Number),
      assemblyId: expect.any(String),
    });
  }, 50000);

  it('should allow admin to sideload locus members', async () => {
    mockDb.select
      .mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([{ ...mockLocusData[0], id: 155095 }]),
      }))
      .mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockLocusMembers),
      }));

    const res = await request(app)
      .get('/api/locus?sideload=locusMembers')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body[0]).toHaveProperty('locusMembers');
    expect(res.body[0].locusMembers).toEqual(expect.arrayContaining(mockLocusMembers));
  }, 10000);

  it('should restrict limited users to specific regions', async () => {
    mockDb.select.mockImplementation(() => ({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([mockLocusData[0]]),
    }));

    const res = await request(app).get('/api/locus').set('Authorization', `Bearer ${limitedToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(0);
  }, 10000);

  it('should prevent limited users from sideloading members', async () => {
    const res = await request(app)
      .get('/api/locus?sideload=locusMembers')
      .set('Authorization', `Bearer ${limitedToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(0);
  }, 10000);
}, 10000);
