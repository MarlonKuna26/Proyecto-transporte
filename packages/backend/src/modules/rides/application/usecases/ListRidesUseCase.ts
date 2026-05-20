import { IUseCase, PaginatedResponse } from '@shared/types';
import { IRideRepository, RideFilters } from '../../domain/interfaces/IRideRepository';
import { Ride, RideStatus } from '../../domain/entities/Ride';
import { RideFilterDTO } from '../dtos/RideDTO';

export class ListRidesUseCase implements IUseCase<RideFilterDTO, PaginatedResponse<Ride>> {
  constructor(private rideRepository: IRideRepository) {}

  async execute(input: RideFilterDTO): Promise<PaginatedResponse<Ride>> {
    const filters: RideFilters = {};
    if (input.originZone) filters.originZone = input.originZone;
    if (input.destinationZone) filters.destinationZone = input.destinationZone;
    if (input.departureDate) filters.departureDate = input.departureDate;
    if (input.status) filters.status = input.status as RideStatus;
    if (input.driverId) {
  filters.driverId = input.driverId;
}

    const offset = (input.page - 1) * input.limit;
    const [rides, total] = await Promise.all([
      this.rideRepository.findAll(filters, input.limit, offset),
      this.rideRepository.countAll(filters),
    ]);

    return {
      data: rides,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        pages: Math.ceil(total / input.limit),
      },
    };
  }
}
