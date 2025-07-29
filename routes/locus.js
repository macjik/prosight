import { Router } from 'express';
import { and, eq, inArray, asc, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { rncLocus, rncLocusMembers } from '../models/schema.js';
import ensureAuth from '../middlewares/auth.js';

const router = Router();

router.get('/', ensureAuth, async (req, res) => {
  try {
    const {
      id,
      assemblyId,
      regionId,
      membershipStatus,
      sideload,
      page = 1,
      rows = 1000,
      sortBy = 'id',
      sortOrder = 'asc',
    } = req.query;

    const userRole = req.user.role;
    const offset = (Number(page) - 1) * Number(rows);

    const locusConditions = [];
    if (id) {
      const ids = Array.isArray(id) ? id.map(Number) : [Number(id)];
      locusConditions.push(inArray(rncLocus.id, ids));
    }
    if (assemblyId) {
      locusConditions.push(eq(rncLocus.assemblyId, String(assemblyId)));
    }

    const memberConditions = [];
    const limitedRegionIds = [86118093, 86696489, 88186467];

    if (userRole === 'limited') {
      memberConditions.push(inArray(rncLocusMembers.regionId, limitedRegionIds));
    } else if (regionId) {
      const regionIds = Array.isArray(regionId) ? regionId.map(Number) : [Number(regionId)];
      memberConditions.push(inArray(rncLocusMembers.regionId, regionIds));
    }

    if (membershipStatus) {
      memberConditions.push(eq(rncLocusMembers.membershipStatus, String(membershipStatus)));
    }

    const sortableFields = ['id', 'locusStart', 'locusStop', 'memberCount'];
    const sortField = sortableFields.includes(String(sortBy)) ? String(sortBy) : 'id';
    const orderDirection = String(sortOrder).toLowerCase() === 'desc' ? desc : asc;

    const baseSelect = {
      id: rncLocus.id,
      assemblyId: rncLocus.assemblyId,
      locusName: rncLocus.locusName,
      publicLocusName: rncLocus.publicLocusName,
      chromosome: rncLocus.chromosome,
      strand: rncLocus.strand,
      locusStart: rncLocus.locusStart,
      locusStop: rncLocus.locusStop,
      memberCount: rncLocus.memberCount,
    };

    if (userRole === 'admin' && sideload === 'locusMembers') {
      const results = await db
        .select({
          ...baseSelect,
          memberId: rncLocusMembers.id,
          regionId: rncLocusMembers.regionId,
          memberLocusId: rncLocusMembers.locusId,
          membershipStatus: rncLocusMembers.membershipStatus,
        })
        .from(rncLocus)
        .leftJoin(rncLocusMembers, eq(rncLocusMembers.locusId, rncLocus.id))
        .where(and(...[...locusConditions, ...memberConditions]))
        .limit(Number(rows))
        .offset(offset)
        .orderBy(orderDirection(rncLocus[sortField]));

      const lociMap = new Map();
      results.forEach((row) => {
        if (!lociMap.has(row.id)) {
          lociMap.set(row.id, {
            ...row,
            locusMembers: [],
          });
          delete lociMap.get(row.id).memberId;
          delete lociMap.get(row.id).regionId;
          delete lociMap.get(row.id).memberLocusId;
          delete lociMap.get(row.id).membershipStatus;
        }

        if (row.memberId) {
          lociMap.get(row.id).locusMembers.push({
            id: row.memberId,
            regionId: row.regionId,
            locusId: row.memberLocusId,
            membershipStatus: row.membershipStatus,
          });
        }
      });

      return res.json(Array.from(lociMap.values()));
    }

    const query = db.select(baseSelect).from(rncLocus);

    if (memberConditions.length > 0 || userRole === 'limited') {
      query.leftJoin(rncLocusMembers, eq(rncLocusMembers.locusId, rncLocus.id));
    }

    const whereConditions =
      userRole === 'limited'
        ? and(...[...locusConditions, ...memberConditions])
        : and(...[...locusConditions, ...(memberConditions.length > 0 ? memberConditions : [])]);

    const results = await query
      .where(whereConditions)
      .limit(Number(rows))
      .offset(offset)
      .orderBy(orderDirection(rncLocus[sortField]));

    const finalResults =
      userRole === 'limited'
        ? [...new Map(results.map((item) => [item.id, item])).values()]
        : results;

    res.json(finalResults);
  } catch (error) {
    console.error('Error fetching locus data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
