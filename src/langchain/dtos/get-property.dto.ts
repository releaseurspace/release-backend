import { ApiProperty } from '@nestjs/swagger';
import { PropertyEntity } from 'src/entities/property.entity';

export class GetPropertyDto {
  @ApiProperty({ description: 'id' })
  id: number;

  @ApiProperty({ description: '부동산 용도' })
  purpose: string;

  @ApiProperty({ description: '보증금' })
  deposit: number;

  @ApiProperty({ description: '월세' })
  monthly_rent: number;

  @ApiProperty({ description: '권리금' })
  key_money: number;

  @ApiProperty({ description: '관리비' })
  maintenance_fee: number;

  @ApiProperty({ description: '평수' })
  size: number;

  @ApiProperty({ description: '설명' })
  description: string;

  @ApiProperty({ description: '건물 정보' })
  building_info: string;

  @ApiProperty({ description: '가장 가까운 지하철역' })
  nearest_station: string;

  @ApiProperty({ description: '가장 가까운 지하철역과의 거리' })
  distance_to_station: string;

  constructor(property: PropertyEntity) {
    this.id = property.id;
    this.purpose = property.purpose;
    this.deposit = property.deposit;
    this.monthly_rent = property.monthly_rent;
    this.key_money = property.key_money;
    this.maintenance_fee = property.maintenance_fee;
    this.size = Math.round(property.size_sqm / 3.3);
    this.description = property.description;
    this.building_info = property.building_info;
    this.nearest_station = property.nearest_station;
    this.distance_to_station = property.distance_to_station;
  }
}
