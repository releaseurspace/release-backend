import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PropertyEntity } from 'src/entities/property.entity';
import { Repository } from 'typeorm';
import { GetPropertyDto } from './dtos/get-property.dto';

@Injectable()
export class PropertyService {
  constructor(
    @InjectRepository(PropertyEntity)
    private readonly propertyRepository: Repository<PropertyEntity>,
  ) {}

  async getProperties(ids: number[]): Promise<GetPropertyDto[]> {
    if (ids.length === 0) return [];
    return await Promise.all(
      ids.map(async (id) => {
        const property = await this.propertyRepository.findOne({
          where: { id },
        });
        return new GetPropertyDto(property);
      }),
    );
  }
}
